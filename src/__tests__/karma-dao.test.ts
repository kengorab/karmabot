import * as fs from 'fs'
import { promisify } from 'util'
import alasql from 'alasql'
import { pick, zip } from 'lodash'
import moment from 'moment'
import { Client } from 'pg'
import * as KarmaDao from '../karma-dao'

const readFileAsync = promisify(fs.readFile)

describe('KarmaDao', () => {
  let testDbPromise: Promise<Client>

  beforeEach(async () => {
    const sqlFile = `${__dirname}/../../db/001-create-tables.sql`
    const createTablesSql = await readFileAsync(sqlFile, { encoding: 'utf-8' })

    await alasql(createTablesSql)

    const mockClient = {
      connect: () => Promise.resolve(null),
      query: async (inputSql: string, values: any[]) => {
        const sql = inputSql.replace(/\$\d/g, match => {
          const idx = parseInt(match.replace('$', '')) - 1
          const value = values[idx]

          return typeof value === 'string' ? `'${value}'` : value
        })
        const rows = await alasql(sql)
        return { rows }
      }
    } as Client
    testDbPromise = Promise.resolve(mockClient)
  })

  afterEach(async () => await alasql('drop table karma_transactions;'))

  describe('getKarmaTarget', () => {
    it('should return KarmaTarget (with total as 0) for target with no transactions', async () => {
      const karmaTarget = await KarmaDao.getKarmaTarget(
        'Claudio',
        testDbPromise
      )
      expect(karmaTarget).toEqual(new KarmaDao.KarmaTarget('Claudio', 0))
    })

    it('should return KarmaTarget with summed total', async () => {
      await alasql(`
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

  describe('getRankedKarmaTargets', () => {
    it('should return 0 rows if there is nothing in the database', async () => {
      const rows = await KarmaDao.getRankedKarmaTargets(
        5,
        KarmaDao.RankType.TOP,
        testDbPromise
      )
      expect(rows.length).toBe(0)
    })

    it('should return 1 row if there are entries for a karma target', async () => {
      await alasql(`
        insert into karma_transactions (karma_target, delta, actor)
        values ('Claudio', 3, 'Ken'), ('Claudio', -1, 'Someone Else');
      `)

      const rows = await KarmaDao.getRankedKarmaTargets(
        5,
        KarmaDao.RankType.TOP,
        testDbPromise
      )
      expect(rows).toEqual([new KarmaDao.KarmaTarget('Claudio', 2)])
    })

    it('should limit to n rows, in desc sorted order, if there are entries for many karma targets', async () => {
      await alasql(`
        insert into karma_transactions (karma_target, delta, actor)
        values ('E1', 2, 'User'), ('E2', -1, 'User'), ('E3', 1, 'User'), ('E4', 4, 'User'), ('E5', 3, 'User');
      `)

      const rows = await KarmaDao.getRankedKarmaTargets(
        3,
        KarmaDao.RankType.TOP,
        testDbPromise
      )
      expect(rows).toEqual([
        new KarmaDao.KarmaTarget('E4', 4),
        new KarmaDao.KarmaTarget('E5', 3),
        new KarmaDao.KarmaTarget('E1', 2)
      ])
    })

    it('should limit to n rows, in asc sorted order, if there are entries for many karma targets', async () => {
      await alasql(`
        insert into karma_transactions (karma_target, delta, actor)
        values ('E1', 2, 'User'), ('E2', -1, 'User'), ('E3', 1, 'User'), ('E4', 4, 'User'), ('E5', 3, 'User');
      `)

      const rows = await KarmaDao.getRankedKarmaTargets(
        3,
        KarmaDao.RankType.BOTTOM,
        testDbPromise
      )
      expect(rows).toEqual([
        new KarmaDao.KarmaTarget('E2', -1),
        new KarmaDao.KarmaTarget('E3', 1),
        new KarmaDao.KarmaTarget('E1', 2)
      ])
    })
  })

  describe('modifyKarma', () => {
    it('should insert a transaction into the database for a new target', async () => {
      await KarmaDao.modifyKarma('Claudio', 3, 'Ken', testDbPromise)
      const rows = await alasql('select * from karma_transactions;')

      const expected = [
        {
          id: 1,
          actor: 'Ken',
          delta: 3,
          karma_target: 'Claudio',
          karma_date: Date.now()
        }
      ]
      zip(expected, rows).forEach(([e, a]) => assertTransactionsEq(e, a))
    })

    it('should insert a transaction into the database for an existing target', async () => {
      await KarmaDao.modifyKarma('Claudio', 3, 'Ken', testDbPromise)
      await KarmaDao.modifyKarma('Claudio', -2, 'Someone Else', testDbPromise)
      const rows = await alasql('select * from karma_transactions;')

      const expected = [
        {
          id: 1,
          actor: 'Ken',
          delta: 3,
          karma_target: 'Claudio',
          karma_date: Date.now()
        },
        {
          id: 2,
          actor: 'Someone Else',
          delta: -2,
          karma_target: 'Claudio',
          karma_date: Date.now()
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

  const dbFormatStr = 'YYYY.MM.DD HH:mm:ss.SSS'
  const timeDiff = moment(expected.karma_date).diff(
    moment(actual.karma_date, dbFormatStr),
    'milliseconds'
  )
  expect(timeDiff).toBeLessThan(200)
}
