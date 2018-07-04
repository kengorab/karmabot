import * as KarmaDao from '../karma-dao'
import { mock } from './test-utils'
import HandlerContext from '../context-manager'

describe('HandlerContext', () => {
  let mockBot
  beforeEach(() => {
    mockBot = {
      getChannels: jest.fn(() => Promise.resolve({ channels: [] })),
      getUsers: jest.fn(() => Promise.resolve({ members: [] }))
    }
  })

  describe('getParams', () => {
    it('should return the params', () => {
      const context = new HandlerContext(mockBot)
      expect(context.getParams()).toEqual({
        icon_emoji: ':scale:',
        as_user: true
      })
    })
  })

  describe('getChannel', () => {
    it('gets the channel from the channel dict', async () => {
      const channel = { id: 'qwervzx', name: 'channel!' }
      mockBot.getChannels.mockImplementationOnce(() =>
        Promise.resolve({
          channels: [channel]
        })
      )

      const context = new HandlerContext(mockBot)
      expect(await context.getChannel('qwervzx')).toEqual(channel)
    })
  })

  describe('getUser', () => {
    it('gets the user from the user dict', async () => {
      const user = { id: 'qwervzx', name: 'user_1' }
      mockBot.getUsers.mockImplementationOnce(() =>
        Promise.resolve({
          members: [user]
        })
      )

      const context = new HandlerContext(mockBot)
      expect(await context.getUser('user_1')).toEqual(user)
    })
  })

  describe('modifyKarma', () => {
    it('calls out to KarmaDao to modify karma, and to get karma totals', async () => {
      const modifyKarmaMock = jest.fn(() => Promise.resolve())
      mock(KarmaDao, 'modifyKarma', modifyKarmaMock)

      const getKarmaTargetMock = jest.fn().mockResolvedValue({ total: 24 })
      mock(KarmaDao, 'getKarmaTarget', getKarmaTargetMock)

      const context = new HandlerContext(mockBot)
      const total = await context.modifyKarma('Claudio', 3, 'Ken')
      expect(total).toEqual(24)

      expect(modifyKarmaMock).toHaveBeenCalledWith('Claudio', 3, 'Ken')
      expect(getKarmaTargetMock).toHaveBeenCalledWith('Claudio')
    })
  })
})
