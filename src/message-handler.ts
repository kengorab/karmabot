import { MessageEvent } from 'slackbots'
import { getKarmaTarget } from './detector'
import HandlerContext from './context-manager'
import { getMessage, getSelfTargetingMessage } from './message-generator'

export async function messageHandler(
  { bot, log, getParams, getChannel, modifyKarma }: HandlerContext,
  data: MessageEvent
): Promise<boolean> {
  log(data)

  if (data.username === bot.name || data.bot_id || data.type !== 'message')
    return false

  const { text, user } = data
  if (!user) return false

  const karmaTarget = getKarmaTarget(text, user)
  if (!karmaTarget) return false

  const channel = await getChannel(data.channel)
  if (!channel) return false

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
