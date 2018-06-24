import SlackBot, { MessageEvent, Channel } from 'slackbots'
import { HandlerConfig } from '../../types/karmabot'
import * as MessageHandler from '../message-handler'
import * as MessageGenerator from '../message-generator'
import * as Detector from '../detector'
import { mock } from './test-utils'

describe('message-handler', () => {
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

    it("returns false if data.bot_id is present, and doesn't proceed", async () => {
      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        bot_id: 'asdf-qwer'
      }
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

    it('calls to modifyKarma for karma target if it exists and is not targeting self', async () => {
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

    it('returns true and calls `bot.postMessageToChannel` with non-self-targeted message if everything goes well', async () => {
      mock(Detector, 'getKarmaTarget', () => ({
        target: 'Nemo',
        amount: 1,
        isBuzzkill: false,
        isTargetingSelf: false
      }))
      mock(MessageGenerator, 'getMessage', () => 'Fake message!!!')

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
        'Fake message!!!',
        { icon_emoji: ':fish:' }
      )
    })

    it('returns true and calls `bot.postMessageToChannel` with self-targeted message if everything goes well', async () => {
      mock(Detector, 'getKarmaTarget', () => ({
        target: 'Nemo',
        amount: 1,
        isBuzzkill: false,
        isTargetingSelf: true
      }))
      mock(MessageGenerator, 'getSelfTargetingMessage', () => ({
        message: 'Fake self-targeting message!!!'
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
        'Fake self-targeting message!!!',
        { icon_emoji: ':fish:' }
      )
    })

    it('returns true and calls `bot.postMessageToChannel` with self-targeted message if everything goes well, and awards karma if necessary', async () => {
      mock(Detector, 'getKarmaTarget', () => ({
        target: 'Nemo',
        amount: 1,
        isBuzzkill: false,
        isTargetingSelf: true
      }))
      mock(MessageGenerator, 'getSelfTargetingMessage', () => ({
        message: 'Fake self-targeting message!!!',
        karmaChange: -1
      }))

      // Mock config functions
      const _config = {
        ...config,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        modifyKarma: jest.fn(() => 12),
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
      expect(_config.modifyKarma).toHaveBeenCalledWith('Nemo', -1)
      expect(bot.postMessageToChannel).toHaveBeenCalledWith(
        'fake-channel',
        'Fake self-targeting message!!!',
        { icon_emoji: ':fish:' }
      )
    })
  })
})
