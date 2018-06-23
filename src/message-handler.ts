import SlackBot, { MessageEvent } from 'slackbots'
import { getKarmaTarget } from './detector'
import { HandlerConfig } from '../types/karmabot'

// Visible for testing
export function getMessage(
  isBuzzkill: boolean,
  delta: number,
  total: number,
  target: string
): string {
  const value = Math.abs(delta)

  const points = (amount: number) => `point${amount === 1 ? '' : 's'}`

  if (isBuzzkill) {
    const verb = delta > 0 ? 'adding' : 'subtracting'

    const buzzkillMode = 'Buzzkill Mode™️ activated!'
    const line1 = `Only ${verb} ${value} ${points(value)}.`
    const line2 = `${target} has ${total} ${points(total)}`
    return `${buzzkillMode} ${line1}\n${line2}`
  } else {
    const verb = delta > 0 ? 'got' : 'lost'
    return `${target} ${verb} ${value} ${points(value)}, and now has ${total}`
  }
}

export async function messageHandler(
  { bot, log, getParams, getChannel, modifyKarma }: HandlerConfig,
  data: MessageEvent
): Promise<boolean> {
  log(data)

  if (data.username === bot.name || data.type !== 'message') return false

  const text = data.text
  const karmaTarget = getKarmaTarget(text)
  if (!karmaTarget) return false

  const channel = await getChannel(data.channel)
  if (!channel) return false

  const { target, amount, isBuzzkill } = karmaTarget
  const total = modifyKarma(target, amount)
  const message = getMessage(isBuzzkill, amount, total, target)

  bot.postMessageToChannel(channel.name, message, getParams())
  return true
}
