import SlackBot, { MessageEvent, Channel } from 'slackbots'
import { HandlerConfig } from '../../types/karmabot'
import * as MessageHandler from '../message-handler'
import * as Detector from '../detector'
import { mock } from './test-utils'

describe('message-handler', () => {
  describe('getMessage', () => {
    describe('in Buzzkill Mode™️', () => {
      it('returns the message for delta = 1', () => {
        const message = MessageHandler.getMessage(true, 1, 2, 'Ken')
        expect(message).toEqual(
          'Buzzkill Mode™️ activated! Only adding 1 point.\nKen has 2 points'
        )
      })

      it('returns the message for delta = -1', () => {
        const message = MessageHandler.getMessage(true, -1, 2, 'Ken')
        expect(message).toEqual(
          'Buzzkill Mode™️ activated! Only subtracting 1 point.\nKen has 2 points'
        )
      })

      it('returns the message for delta > 1', () => {
        const message = MessageHandler.getMessage(true, 4, 2, 'Ken')
        expect(message).toEqual(
          'Buzzkill Mode™️ activated! Only adding 4 points.\nKen has 2 points'
        )
      })

      it('returns the message for delta < -1', () => {
        const message = MessageHandler.getMessage(true, -4, 2, 'Ken')
        expect(message).toEqual(
          'Buzzkill Mode™️ activated! Only subtracting 4 points.\nKen has 2 points'
        )
      })
    })

    describe('not in Buzzkill Mode™️', () => {
      it('returns the message for delta = 1', () => {
        const message = MessageHandler.getMessage(false, 1, 2, 'Ken')
        expect(message).toEqual('Ken got 1 point, and now has 2')
      })

      it('returns the message for delta = -1', () => {
        const message = MessageHandler.getMessage(false, -1, 2, 'Ken')
        expect(message).toEqual('Ken lost 1 point, and now has 2')
      })

      it('returns the message for delta > 1', () => {
        const message = MessageHandler.getMessage(false, 4, 2, 'Ken')
        expect(message).toEqual('Ken got 4 points, and now has 2')
      })

      it('returns the message for delta < -1', () => {
        const message = MessageHandler.getMessage(false, -4, 2, 'Ken')
        expect(message).toEqual('Ken lost 4 points, and now has 2')
      })
    })
  })

  describe('messageHandler', () => {
    let bot: SlackBot
    let config: HandlerConfig
    beforeEach(() => {
      bot = {
        token: 'aoishjklv-023iuhejkrw-=xvc',
        name: 'mockbot',
        on: jest.fn(),
        postMessageToChannel: jest.fn(),
        getChannels: jest.fn(),
        getUsers: jest.fn()
      }

      config = {
        bot,
        log: jest.fn(),
        getParams: jest.fn(),
        getChannel: jest.fn(),
        modifyKarma: jest.fn()
      }
    })

    it('calls `log` when handling message', async () => {
      const messageBody = { username: 'mockbot' }
      await MessageHandler.messageHandler(config, messageBody as MessageEvent)

      expect(config.log).toHaveBeenCalledWith(messageBody)
    })

    it("returns false if data.username is the name of the bot, and doesn't proceed", async () => {
      const messageBody = { username: 'mockbot' }
      const response = await MessageHandler.messageHandler(
        config,
        messageBody as MessageEvent
      )

      expect(response).toBe(false)
      expect(config.modifyKarma).not.toHaveBeenCalled()
      expect(bot.postMessageToChannel).not.toHaveBeenCalled()
    })

    it("returns false if data.type is not 'message', and doesn't proceed", async () => {
      const messageBody = { username: 'not-mockbot', type: 'not-message' }
      const response = await MessageHandler.messageHandler(
        config,
        messageBody as MessageEvent
      )

      expect(response).toBe(false)
      expect(config.modifyKarma).not.toHaveBeenCalled()
      expect(bot.postMessageToChannel).not.toHaveBeenCalled()
    })

    it("returns false if there's no karma target, and doesn't proceed", async () => {
      mock(Detector, 'getKarmaTarget', () => null)

      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        text: "whatever text, it doesn't matter"
      }
      const response = await MessageHandler.messageHandler(
        config,
        messageBody as MessageEvent
      )

      expect(response).toBe(false)
      expect(config.modifyKarma).not.toHaveBeenCalled()
      expect(bot.postMessageToChannel).not.toHaveBeenCalled()
    })

    it("returns false if there's no channel for id, and doesn't proceed", async () => {
      mock(Detector, 'getKarmaTarget', () => ({
        target: 'Nemo',
        amount: 1,
        isBuzzkill: false
      }))

      // Mock config functions
      const _config = {
        ...config,
        getChannel: () => Promise.resolve(null)
      }

      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        text: "whatever text, it doesn't matter"
      }
      const response = await MessageHandler.messageHandler(
        _config,
        messageBody as MessageEvent
      )

      expect(response).toBe(false)
      expect(_config.modifyKarma).not.toHaveBeenCalled()
      expect(bot.postMessageToChannel).not.toHaveBeenCalled()
    })

    it('calls to modifyKarma for karma target if it exists', async () => {
      mock(Detector, 'getKarmaTarget', () => ({
        target: 'Nemo',
        amount: 1,
        isBuzzkill: false
      }))

      // Mock config functions
      const _config = {
        ...config,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel)
      }

      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        text: "whatever text, it doesn't matter"
      }
      await MessageHandler.messageHandler(_config, messageBody as MessageEvent)

      expect(config.modifyKarma).toHaveBeenCalledWith('Nemo', 1)
    })

    it('returns true and calls `bot.postMessageToChannel` if everything goes well', async () => {
      mock(Detector, 'getKarmaTarget', () => ({
        target: 'Nemo',
        amount: 1,
        isBuzzkill: false
      }))

      // Mock config functions
      const _config = {
        ...config,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        modifyKarma: () => 12,
        getParams: () => ({ icon_emoji: ':fish:' })
      }

      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        text: "whatever text, it doesn't matter"
      }
      const response = await MessageHandler.messageHandler(
        _config,
        messageBody as MessageEvent
      )

      expect(response).toBe(true)
      expect(bot.postMessageToChannel).toHaveBeenCalledWith(
        'fake-channel',
        'Nemo got 1 point, and now has 12',
        { icon_emoji: ':fish:' }
      )
    })
  })
})
