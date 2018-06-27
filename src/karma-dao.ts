import sqlite from 'sqlite'
import escape from 'pg-escape'

const dbPromise = sqlite
  .open('./db.sqlite', { promise: Promise })
  .catch((error: Error) => {
    console.error('Could not connect to database:', error)
    process.exit(1)
  }) as Promise<sqlite.Database>

export class KarmaTarget {
  constructor(public readonly name: string, public readonly total: number) {}
}

export async function getKarmaTarget(
  target: string,
  _db: Promise<sqlite.Database> = dbPromise
): Promise<KarmaTarget> {
  const db = await _db

  const sql = `
    select
      karma_target as karmaTarget,
      sum(delta) as total
    from karma_transactions
    where karma_target = %L;
  `
  const targets = await db.all(escape(sql, target))

  if (targets.length === 0 || targets[0].karmaTarget === null)
    return new KarmaTarget(target, 0)
  if (targets.length !== 1)
    console.log(`WARN: More than 1 target with name: ${target}; using first`)

  const { karmaTarget, total } = targets[0]
  return new KarmaTarget(karmaTarget as string, total as number)
}

export async function modifyKarma(
  target: string,
  amount: number,
  actor: string,
  _db: Promise<sqlite.Database> = dbPromise
) {
  const db = await _db

  const sql = `
    insert into karma_transactions (karma_target, delta, actor)
    values (%L, ${amount}, %L);
  `

  await db.exec(escape(sql, target, actor))
}
