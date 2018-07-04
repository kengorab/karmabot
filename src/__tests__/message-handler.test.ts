import SlackBot, { MessageEvent, Channel } from 'slackbots'
import HandlerContext from '../context-manager'
import * as MessageHandler from '../message-handler'
import * as MessageGenerator from '../message-generator'
import * as Detector from '../detector'
import * as KarmaDao from '../karma-dao'
import { mock } from './test-utils'

describe('message-handler', () => {
  let bot: SlackBot
  let context: HandlerContext
  beforeEach(() => {
    bot = {
      token: 'aoishjklv-023iuhejkrw-=xvc',
      name: 'mockbot',
      on: jest.fn(),
      postMessageToChannel: jest.fn(),
      getChannels: jest.fn(),
      getUsers: jest.fn()
    }

    context = {
      bot,
      log: jest.fn(),
      getParams: jest.fn(),
      getChannel: jest.fn(),
      getUser: jest.fn(),
      modifyKarma: jest.fn()
    }
  })

  describe('messageHandler', () => {
    it("returns false if data.username is the name of the bot, and doesn't proceed", async () => {
      const messageBody = { username: 'mockbot' }
      const response = await MessageHandler.messageHandler(
        context,
        messageBody as MessageEvent
      )

      expect(response).toBe(false)
      expect(context.modifyKarma).not.toHaveBeenCalled()
      expect(bot.postMessageToChannel).not.toHaveBeenCalled()
    })

    it("returns false if data.type is not 'message', and doesn't proceed", async () => {
      const messageBody = { username: 'not-mockbot', type: 'not-message' }
      const response = await MessageHandler.messageHandler(
        context,
        messageBody as MessageEvent
      )

      expect(response).toBe(false)
      expect(context.modifyKarma).not.toHaveBeenCalled()
      expect(bot.postMessageToChannel).not.toHaveBeenCalled()
    })

    it("returns false if data.bot_id is present, and doesn't proceed", async () => {
      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        bot_id: 'asdf-qwer'
      }
      const response = await MessageHandler.messageHandler(
        context,
        messageBody as MessageEvent
      )

      expect(response).toBe(false)
      expect(context.modifyKarma).not.toHaveBeenCalled()
      expect(bot.postMessageToChannel).not.toHaveBeenCalled()
    })

    it('calls `log` when handling message', async () => {
      const messageBody = { username: 'not-mockbot', type: 'message' }
      await MessageHandler.messageHandler(context, messageBody as MessageEvent)

      expect(context.log).toHaveBeenCalledWith(messageBody)
    })

    it("returns false if data.user is not present, and doesn't proceed", async () => {
      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        bot_id: 'asdf-qwer',
        user: undefined
      }
      const response = await MessageHandler.messageHandler(
        context,
        messageBody as MessageEvent
      )

      expect(response).toBe(false)
      expect(context.modifyKarma).not.toHaveBeenCalled()
      expect(bot.postMessageToChannel).not.toHaveBeenCalled()
    })

    it("returns false if there's no karma target, and doesn't proceed", async () => {
      mock(Detector, 'getKarmaTarget', () => null)

      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        text: "whatever text, it doesn't matter",
        user: 'asdf'
      }
      const response = await MessageHandler.messageHandler(
        context,
        messageBody as MessageEvent
      )

      expect(response).toBe(false)
      expect(context.modifyKarma).not.toHaveBeenCalled()
      expect(bot.postMessageToChannel).not.toHaveBeenCalled()
    })

    it("returns false if there's no channel for id, and doesn't proceed", async () => {
      mock(Detector, 'getKarmaTarget', () => ({
        target: 'Nemo',
        amount: 1,
        isBuzzkill: false
      }))

      // Mock context functions
      const _context = {
        ...context,
        getChannel: () => Promise.resolve(null),
        getUser: () => Promise.resolve(null),
        modifyKarma: jest.fn()
      }

      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        text: "whatever text, it doesn't matter",
        user: 'asdf'
      }
      const response = await MessageHandler.messageHandler(
        _context,
        messageBody as MessageEvent
      )

      expect(response).toBe(false)
      expect(_context.modifyKarma).not.toHaveBeenCalled()
      expect(bot.postMessageToChannel).not.toHaveBeenCalled()
    })

    it('calls to modifyKarma for karma target if it exists and is not targeting self', async () => {
      mock(Detector, 'getKarmaTarget', () => ({
        target: 'Nemo',
        amount: 1,
        isBuzzkill: false
      }))

      // Mock context functions
      const _context = {
        ...context,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        getUser: () => Promise.resolve({ id: 'qowieur', name: 'fake name' }),
        modifyKarma: jest.fn()
      }

      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        text: "whatever text, it doesn't matter",
        user: 'asdf'
      }
      await MessageHandler.messageHandler(_context, messageBody as MessageEvent)

      expect(_context.modifyKarma).toHaveBeenCalledWith('Nemo', 1, 'asdf')
    })

    it('returns true and calls `bot.postMessageToChannel` with non-self-targeted message if everything goes well', async () => {
      mock(Detector, 'getKarmaTarget', () => ({
        target: 'Nemo',
        amount: 1,
        isBuzzkill: false,
        isTargetingSelf: false
      }))
      mock(MessageGenerator, 'getMessage', () => 'Fake message!!!')

      // Mock context functions
      const _context = {
        ...context,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        getUser: () => Promise.resolve({ id: 'qowieur', name: 'fake name' }),
        modifyKarma: () => Promise.resolve(12),
        getParams: () => ({ icon_emoji: ':fish:' })
      }

      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        text: "whatever text, it doesn't matter",
        user: 'asdf'
      }
      const response = await MessageHandler.messageHandler(
        _context,
        messageBody as MessageEvent
      )

      expect(response).toBe(true)
      expect(bot.postMessageToChannel).toHaveBeenCalledWith(
        'fake-channel',
        'Fake message!!!',
        {
          icon_emoji: ':fish:'
        }
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

      // Mock context functions
      const _context = {
        ...context,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        getUser: () => Promise.resolve({ id: 'qowieur', name: 'fake name' }),
        modifyKarma: () => Promise.resolve(12),
        getParams: () => ({ icon_emoji: ':fish:' })
      }

      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        text: "whatever text, it doesn't matter",
        user: 'asdf'
      }
      const response = await MessageHandler.messageHandler(
        _context,
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

      // Mock context functions
      const _context = {
        ...context,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        getUser: () => Promise.resolve({ id: 'qowieur', name: 'fake name' }),
        modifyKarma: jest.fn(() => 12),
        getParams: () => ({ icon_emoji: ':fish:' })
      }

      const messageBody = {
        username: 'not-mockbot',
        type: 'message',
        text: "whatever text, it doesn't matter",
        user: 'asdf'
      }
      const response = await MessageHandler.messageHandler(
        _context,
        messageBody as MessageEvent
      )

      expect(response).toBe(true)
      expect(_context.modifyKarma).toHaveBeenCalledWith(
        'Nemo',
        -1,
        _context.bot.name
      )
      expect(bot.postMessageToChannel).toHaveBeenCalledWith(
        'fake-channel',
        'Fake self-targeting message!!!',
        { icon_emoji: ':fish:' }
      )
    })
  })

  describe('handleBotCommand', () => {
    const entries = [
      new KarmaDao.KarmaTarget('Name 1', 5),
      new KarmaDao.KarmaTarget('Name 2', 4),
      new KarmaDao.KarmaTarget('Name 3', 3),
      new KarmaDao.KarmaTarget('Name 4', 2),
      new KarmaDao.KarmaTarget('Name 5', 1)
    ]

    it('should send a "ranked" message with top 5, if the command is just `top`', async () => {
      const getRankedKarmaTargetsMock = jest.fn().mockResolvedValue(entries)
      mock(KarmaDao, 'getRankedKarmaTargets', getRankedKarmaTargetsMock)

      const _context = {
        ...context,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        getUser: () => Promise.resolve({ id: 'qowieur', name: 'fake name' }),
        modifyKarma: jest.fn(() => 12),
        getParams: () => ({ icon_emoji: ':fish:' })
      }

      await MessageHandler.handleBotCommand(
        _context,
        { type: Detector.BotCommandType.TOP },
        'fake-channel'
      )

      expect(getRankedKarmaTargetsMock).toHaveBeenCalledWith(
        5,
        KarmaDao.RankType.TOP
      )

      const message = [
        'Name 1: 5 points',
        'Name 2: 4 points',
        'Name 3: 3 points',
        'Name 4: 2 points',
        'Name 5: 1 point'
      ].join('\n')
      expect(_context.bot.postMessageToChannel).toHaveBeenCalledWith(
        'fake-channel',
        message,
        {
          icon_emoji: ':fish:'
        }
      )
    })

    it('should send a "ranked" message with top 2, if the command is `top 2`', async () => {
      const value = entries.slice(0, 2)
      const getRankedKarmaTargetsMock = jest.fn().mockResolvedValue(value)
      mock(KarmaDao, 'getRankedKarmaTargets', getRankedKarmaTargetsMock)

      const _context = {
        ...context,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        getUser: () => Promise.resolve({ id: 'qowieur', name: 'fake name' }),
        modifyKarma: jest.fn(() => 12),
        getParams: () => ({ icon_emoji: ':fish:' })
      }

      await MessageHandler.handleBotCommand(
        _context,
        { type: Detector.BotCommandType.TOP_N, payload: 2 },
        'fake-channel'
      )

      expect(getRankedKarmaTargetsMock).toHaveBeenCalledWith(
        2,
        KarmaDao.RankType.TOP
      )

      const message = 'Name 1: 5 points\nName 2: 4 points'
      expect(_context.bot.postMessageToChannel).toHaveBeenCalledWith(
        'fake-channel',
        message,
        {
          icon_emoji: ':fish:'
        }
      )
    })

    it('should send a "ranked" message with bottom 5, if the command is just `bottom`', async () => {
      const value = [...entries].reverse()
      const getRankedKarmaTargetsMock = jest.fn().mockResolvedValue(value)
      mock(KarmaDao, 'getRankedKarmaTargets', getRankedKarmaTargetsMock)

      const _context = {
        ...context,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        getUser: () => Promise.resolve({ id: 'qowieur', name: 'fake name' }),
        modifyKarma: jest.fn(() => 12),
        getParams: () => ({ icon_emoji: ':fish:' })
      }

      await MessageHandler.handleBotCommand(
        _context,
        { type: Detector.BotCommandType.BOTTOM },
        'fake-channel'
      )

      expect(getRankedKarmaTargetsMock).toHaveBeenCalledWith(
        5,
        KarmaDao.RankType.BOTTOM
      )

      const message = [
        'Name 5: 1 point',
        'Name 4: 2 points',
        'Name 3: 3 points',
        'Name 2: 4 points',
        'Name 1: 5 points'
      ].join('\n')
      expect(_context.bot.postMessageToChannel).toHaveBeenCalledWith(
        'fake-channel',
        message,
        {
          icon_emoji: ':fish:'
        }
      )
    })

    it('should send a "ranked" message with bottom 2, if the command is `bottom 2`', async () => {
      const value = [...entries].reverse().slice(0, 2)
      const getRankedKarmaTargetsMock = jest.fn().mockResolvedValue(value)
      mock(KarmaDao, 'getRankedKarmaTargets', getRankedKarmaTargetsMock)

      const _context = {
        ...context,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        getUser: () => Promise.resolve({ id: 'qowieur', name: 'fake name' }),
        modifyKarma: jest.fn(() => 12),
        getParams: () => ({ icon_emoji: ':fish:' })
      }

      await MessageHandler.handleBotCommand(
        _context,
        { type: Detector.BotCommandType.BOTTOM_N, payload: 2 },
        'fake-channel'
      )

      expect(getRankedKarmaTargetsMock).toHaveBeenCalledWith(
        2,
        KarmaDao.RankType.BOTTOM
      )

      const message = 'Name 5: 1 point\nName 4: 2 points'
      expect(_context.bot.postMessageToChannel).toHaveBeenCalledWith(
        'fake-channel',
        message,
        {
          icon_emoji: ':fish:'
        }
      )
    })

    it('should send a help message if the command is `help`', () => {
      const _context = {
        ...context,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        getUser: () => Promise.resolve({ id: 'qowieur', name: 'fake name' }),
        modifyKarma: jest.fn(() => 12),
        getParams: () => ({ icon_emoji: ':fish:' })
      }

      MessageHandler.handleBotCommand(
        _context,
        { type: Detector.BotCommandType.HELP },
        'fake-channel'
      )

      expect(bot.postMessageToChannel).toHaveBeenCalled()
      const [channel, message, params] = bot.postMessageToChannel.mock.calls[0]
      expect(channel).toEqual('fake-channel')
      expect(
        message.startsWith(`${bot.name} helps you keep score of things`)
      ).toBe(true)
      expect(params).toEqual({ icon_emoji: ':fish:' })
    })

    it('should send an "unknown" message if the command is unknown', () => {
      const _context = {
        ...context,
        getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
        getUser: () => Promise.resolve({ id: 'qowieur', name: 'fake name' }),
        modifyKarma: jest.fn(() => 12),
        getParams: () => ({ icon_emoji: ':fish:' })
      }

      MessageHandler.handleBotCommand(
        _context,
        { type: Detector.BotCommandType.UNKNOWN },
        'fake-channel'
      )

      expect(bot.postMessageToChannel).toHaveBeenCalledWith(
        'fake-channel',
        "I'm sorry, that command is unrecognized. Try the `help` command to learn which commands are supported",
        { icon_emoji: ':fish:' }
      )
    })
  })
})
