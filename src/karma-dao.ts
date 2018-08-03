import dotenv from 'dotenv'
import { Client } from 'pg'
import { groupBy, Dictionary } from 'lodash'
import moment from 'moment'

dotenv.config()
const { DATABASE_URL: databaseUrl } = process.env
if (!databaseUrl) {
  console.error(`Could not start bot due to missing DATABASE_URL value`)
  process.exit(1)
}

const _client = new Client({
  connectionString: databaseUrl
})
const _clientPromise = _client.connect().then(() => _client)

export class KarmaTarget {
  constructor(public readonly name: string, public readonly total: number) {}
}

export async function getKarmaTarget(
  target: string,
  clientPromise: Promise<Client> = _clientPromise
): Promise<KarmaTarget> {
  const client = await clientPromise

  const sql = `
    select karma_target, sum(delta) as total
    from karma_transactions
    where karma_target = $1 
    group by karma_target;
  `
  const values = [target]
  const { rows } = await client.query(sql, values)

  if (rows.length === 0 || !rows[0].karma_target)
    return new KarmaTarget(target, 0)
  if (rows.length !== 1)
    console.log(`WARN: More than 1 target with name: ${target}; using first`)

  const { karma_target, total } = rows[0]
  return new KarmaTarget(karma_target as string, total as number)
}

export enum RankType {
  TOP,
  BOTTOM
}

export async function getRankedKarmaTargets(
  amount: number,
  rankType: RankType = RankType.TOP,
  clientPromise: Promise<Client> = _clientPromise
): Promise<KarmaTarget[]> {
  const client = await clientPromise

  const orderBy = rankType === RankType.TOP ? 'desc' : 'asc'

  const sql = `
    select karma_target, sum(delta) as total
    from karma_transactions
    group by karma_target
    order by total ${orderBy}
    limit $1;
  `
  const values = [amount]
  const { rows } = await client.query(sql, values)

  if (rows.length === 0 || !rows[0].karma_target) return []

  return rows.map(
    ({ karma_target, total }) =>
      new KarmaTarget(karma_target as string, total as number)
  )
}

export enum BucketType {
  DAILY,
  WEEKLY,
  MONTHLY
}

type Bucket = { name: string } & { [karmaTarget: string]: number }

interface DbRow {
  karma_target: string
  sum: string
  bucket: string
}

function getRankedTargets(rows: DbRow[], amount: number, rankType: RankType) {
  const sums = rows.reduce<{ [karmaTarget: string]: number }>(
    (acc, row) => ({
      ...acc,
      [row.karma_target]: (acc[row.karma_target] || 0) + parseInt(row.sum)
    }),
    {}
  )
  const rankedTargets = Object.entries(sums)
    .sort(
      ([_a, vA], [_b, vB]) => (rankType === RankType.TOP ? 1 : -1) * (vB - vA)
    )
    .map(([name, _]) => name)
  return rankedTargets.slice(0, amount)
}

function getCumulativeBuckets(
  buckets: Bucket[],
  bucketType: BucketType,
  dateFormat: string,
  targets: string[],
  now: moment.Moment = moment()
): Bucket[] {
  const presentBuckets: { [name: string]: Bucket } = buckets.reduce(
    (acc, bucket) => ({ ...acc, [bucket.name]: bucket }),
    {}
  )

  const allBuckets: Bucket[] = []
  const start = moment(buckets[0].name, dateFormat).startOf('day')
  const end = now
  while (start.isBefore(end)) {
    if (presentBuckets[start.format(dateFormat)]) {
      allBuckets.push(presentBuckets[start.format(dateFormat)])
    } else {
      allBuckets.push({ name: start.format(dateFormat) } as Bucket)
    }

    if (bucketType === BucketType.DAILY) {
      start.add(1, 'day')
    } else if (bucketType === BucketType.WEEKLY) {
      start.add(1, 'week')
    } else if (bucketType === BucketType.MONTHLY) {
      start.add(1, 'month')
    }
  }

  return allBuckets.map((bucket, i) =>
    targets.reduce(
      (acc, target) => {
        const prevValue = i === 0 ? 0 : allBuckets[i - 1][target] || 0
        const sum = prevValue + (bucket[target] || 0)
        return { ...acc, [target]: sum }
      },
      { name: bucket.name } as Bucket
    )
  )
}

export async function getRankedBucketedKarmaTargets(
  amount: number,
  maxNumBuckets: number,
  rankType: RankType = RankType.TOP,
  bucketType: BucketType = BucketType.DAILY,
  clientPromise: Promise<Client> = _clientPromise
): Promise<Bucket[]> {
  const client = await clientPromise

  let sqlDateFmt = ''
  let dateFormat = ''
  if (bucketType === BucketType.DAILY) {
    sqlDateFmt = 'day'
    dateFormat = 'MMM D, YYYY'
  } else if (bucketType === BucketType.WEEKLY) {
    sqlDateFmt = 'week'
    dateFormat = 'MMM D, YYYY'
  } else if (bucketType === BucketType.MONTHLY) {
    sqlDateFmt = 'month'
    dateFormat = 'MMM YYYY'
  }

  const sql = `
    select karma_target, sum(delta), date_trunc('${sqlDateFmt}', karma_date) as bucket
    from karma_transactions group by bucket, karma_target;
  `
  const { rows }: { rows: DbRow[] } = await client.query(sql)
  if (rows.length === 0 || !rows[0].karma_target) return []

  const bucketedRows = groupBy(rows, 'bucket')
  const rankedTargets = getRankedTargets(rows, amount, rankType)

  const bucketedData: Bucket[] = Object.values(bucketedRows).map(
    valuesForBucket => {
      const bucketName = moment(valuesForBucket[0].bucket).format(dateFormat)
      return valuesForBucket
        .filter(value => rankedTargets.includes(value.karma_target))
        .reduce(
          (acc, value) => ({
            ...acc,
            [value.karma_target]: parseInt(value.sum)
          }),
          { name: bucketName } as Bucket
        )
    }
  )
  const completedData = getCumulativeBuckets(
    bucketedData,
    bucketType,
    dateFormat,
    rankedTargets
  )
  const end = completedData.length
  const start = completedData.length - maxNumBuckets
  return completedData.slice(start, end)
}

export async function modifyKarma(
  target: string,
  amount: number,
  actor: string,
  clientPromise: Promise<Client> = _clientPromise
) {
  const client = await clientPromise

  const sql = `
    insert into karma_transactions (karma_target, delta, actor)
    values ($1, $2, $3);
  `
  const values = [target, amount, actor]
  await client.query(sql, values)
}
