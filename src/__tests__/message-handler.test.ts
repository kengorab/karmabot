import SlackBot, { MessageEvent, Channel } from 'slackbots'
import HandlerContext from '../context-manager'
import * as MessageHandler from '../message-handler'
import * as MessageGenerator from '../message-generator'
import * as Detector from '../detector'
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
      modifyKarma: jest.fn()
    }
  })

  it('calls `log` when handling message', async () => {
    const messageBody = { username: 'mockbot' }
    await MessageHandler.messageHandler(context, messageBody as MessageEvent)

    expect(context.log).toHaveBeenCalledWith(messageBody)
  })

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

    // Mock context functions
    const _context = {
      ...context,
      getChannel: () => Promise.resolve({ name: 'fake-channel' } as Channel),
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
