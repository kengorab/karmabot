import { MessageEvent } from 'slackbots'
import { getKarmaTarget } from './detector'
import { HandlerConfig } from '../types/karmabot'
import { getMessage, getSelfTargetingMessage } from './message-generator'

export async function messageHandler(
  { bot, log, getParams, getChannel, modifyKarma }: HandlerConfig,
  data: MessageEvent
): Promise<boolean> {
  log(data)

  if (data.username === bot.name || data.bot_id || data.type !== 'message')
    return false

  const { text, user } = data
  const karmaTarget = getKarmaTarget(text, user || '')
  if (!karmaTarget) return false

  const channel = await getChannel(data.channel)
  if (!channel) return false

  const { target, amount, isBuzzkill, isTargetingSelf } = karmaTarget

  let message
  if (isTargetingSelf) {
    const { message: m, karmaChange } = getSelfTargetingMessage(amount, target)
    message = m

    if (karmaChange) {
      modifyKarma(target, karmaChange)
    }
  } else {
    const total = modifyKarma(target, amount)
    message = getMessage(isBuzzkill, amount, total, target)
  }

  bot.postMessageToChannel(channel.name, message, getParams())

  return true
}
