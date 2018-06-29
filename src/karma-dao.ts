import dotenv from 'dotenv'
import { Client } from 'pg'

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
