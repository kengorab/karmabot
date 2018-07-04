import SlackBot, { MessageEvent } from 'slackbots'
import {
  getKarmaTarget,
  getBotCommand,
  isBotCommand,
  BotCommand,
  BotCommandType
} from './detector'
import HandlerContext from './context-manager'
import { getMessage, getSelfTargetingMessage } from './message-generator'
import { getRankedKarmaTargets, RankType } from './karma-dao'

export async function messageHandler(
  context: HandlerContext,
  data: MessageEvent
): Promise<boolean> {
  const { bot, log, getParams, getChannel, getUser, modifyKarma } = context

  if (data.username === bot.name || data.bot_id || data.type !== 'message')
    return false

  log(data)

  const { text, user } = data
  if (!user) return false

  const channel = await getChannel(data.channel)
  if (!channel) return false

  const botUser = await getUser(bot.name)
  if (isBotCommand(text, botUser.id)) {
    const botCmd = getBotCommand(text)
    // handleBotCommand(context, botCmd, channel.name)
    await handleBotCommand(bot, getParams, botCmd, channel.name)
    return true
  }

  const karmaTarget = getKarmaTarget(text, user)
  if (!karmaTarget) return false

  const { target, amount, isBuzzkill, isTargetingSelf } = karmaTarget

  let message
  if (isTargetingSelf) {
    const { message: m, karmaChange } = getSelfTargetingMessage(amount, target)
    message = m

    if (karmaChange) {
      modifyKarma(target, karmaChange, bot.name)
    }
  } else {
    const total = await modifyKarma(target, amount, user)
    message = getMessage(isBuzzkill, amount, total, target)
  }

  bot.postMessageToChannel(channel.name, message, getParams())

  return true
}

// Visible for testing
export async function handleBotCommand(
  { bot, getParams }: HandlerContext,
  botCmd: BotCommand,
  channel: string
): Promise<void> {
  let message: string
  switch (botCmd.type) {
    case BotCommandType.TOP:
    case BotCommandType.TOP_N:
      const amount =
        botCmd.type === BotCommandType.TOP ? 5 : (botCmd.payload as number)
      const rankedTargets = await getRankedKarmaTargets(amount)

      message = rankedTargets
        .map(({ name, total }) => {
          const pointsText = total === 1 ? 'point' : 'points'
          return `${name}: ${total} ${pointsText}`
        })
        .join('\n')
      break
    case BotCommandType.UNKNOWN:
    default: {
      message =
        "I'm sorry, that command is unrecognized. Try the `help` command to learn which commands are supported"
      break
    }
  }

  bot.postMessageToChannel(channel, message, getParams())
}
