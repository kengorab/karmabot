import sqlite from 'sqlite'
import * as fs from 'fs'
import { promisify } from 'util'
import { pick, zip } from 'lodash'
import moment from 'moment'
import * as KarmaDao from '../karma-dao'

const readFileAsync = promisify(fs.readFile)

describe('KarmaDao', () => {
  let testDbPromise: Promise<sqlite.Database>
  beforeAll(async () => {
    const sqlFile = `${__dirname}/../../db/001-create-tables.sql`
    const createTablesSql = await readFileAsync(sqlFile, { encoding: 'utf-8' })

    testDbPromise = sqlite.open('./test-db.sqlite', { promise: Promise })
    const db = await testDbPromise
    await db.exec(createTablesSql)
  })

  afterEach(async () => {
    const db = await testDbPromise
    db.exec('delete from karma_transactions;')
  })

  afterAll(async () => {
    const db = await testDbPromise
    db.exec('drop table if exists karma_transactions;')
  })

  describe('getKarmaTarget', () => {
    it('should return KarmaTarget (with total as 0) for target with no transactions', async () => {
      const karmaTarget = await KarmaDao.getKarmaTarget(
        'Claudio',
        testDbPromise
      )
      expect(karmaTarget).toEqual(new KarmaDao.KarmaTarget('Claudio', 0))
    })

    it('should return KarmaTarget with summed total', async () => {
      const db = await testDbPromise
      await db.exec(`
        insert into karma_transactions (karma_target, delta, actor)
        values ('Claudio', 3, 'Ken'), ('Claudio', -1, 'Someone Else');
      `)

      const karmaTarget = await KarmaDao.getKarmaTarget(
        'Claudio',
        testDbPromise
      )
      expect(karmaTarget).toEqual(new KarmaDao.KarmaTarget('Claudio', 2))
    })
  })

  describe('modifyKarma', () => {
    it('should insert a transaction into the database for a new target', async () => {
      await KarmaDao.modifyKarma('Claudio', 3, 'Ken', testDbPromise)
      const db = await testDbPromise
      const rows = await db.all('select * from karma_transactions;')

      const expected = [
        {
          id: 1,
          actor: 'Ken',
          delta: 3,
          karma_target: 'Claudio',
          karma_date: moment().valueOf()
        }
      ]
      zip(expected, rows).forEach(([e, a]) => assertTransactionsEq(e, a))
    })

    it('should insert a transaction into the database for an existing target', async () => {
      await KarmaDao.modifyKarma('Claudio', 3, 'Ken', testDbPromise)
      await KarmaDao.modifyKarma('Claudio', -2, 'Someone Else', testDbPromise)
      const db = await testDbPromise
      const rows = await db.all('select * from karma_transactions;')

      const expected = [
        {
          id: 1,
          actor: 'Ken',
          delta: 3,
          karma_target: 'Claudio',
          karma_date: moment().valueOf()
        },
        {
          id: 2,
          actor: 'Someone Else',
          delta: -2,
          karma_target: 'Claudio',
          karma_date: moment().valueOf()
        }
      ]
      zip(expected, rows).forEach(([e, a]) => assertTransactionsEq(e, a))
    })
  })
})

function assertTransactionsEq(expected, actual) {
  expect(pick(actual, 'id', 'actor', 'delta', 'karma_target')).toEqual(
    pick(expected, 'id', 'actor', 'delta', 'karma_target')
  )

  const timeDiff = moment(expected.karma_date).diff(
    moment(actual.karma_date),
    'milliseconds'
  )
  expect(timeDiff).toBeLessThan(200)
}