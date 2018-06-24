import { KarmaTarget } from './detector'

export function getMessage(
  isBuzzkill: boolean,
  amount: number,
  total: number,
  target: string
): string {
  const value = Math.abs(amount)

  const points = (val: number) => `point${val === 1 ? '' : 's'}`

  if (isBuzzkill) {
    const verb = amount > 0 ? 'adding' : 'subtracting'

    const buzzkillMode = 'Buzzkill Mode™️ activated!'
    const line1 = `Only ${verb} ${value} ${points(value)}.`
    const line2 = `${target} has ${total} ${points(total)}`
    return `${buzzkillMode} ${line1}\n${line2}`
  } else {
    const verb = amount > 0 ? 'got' : 'lost'
    return `${target} ${verb} ${value} ${points(value)}, and now has ${total}`
  }
}

const encouragement = [
  "Hey, don't be so hard on yourself!",
  "I'm sure you don't deserve that!",
  "Chin up! Don't punish yourself too hard!"
]
const chastisement = [
  'Who do you think you are, trying to give yourself points!?',
  'Do you think this is some kind of game?',
  "No way, that's cheating! Shame on you!",
  'UNACCEPTABLE!!!',
  "You can't just give _yourself_ points!",
  'You think you _deserve_ those points?'
]

export interface SelfTargetingMessageResult {
  message: string
  karmaChange?: number
}

export function getSelfTargetingMessage(
  amount: number,
  target: string,
  rand: () => number = Math.random
): SelfTargetingMessageResult {
  let message, karmaChange

  if (amount < 0) {
    message = encouragement[Math.floor(rand() * encouragement.length)] || ''
    if (rand() < 0.15) {
      message = `${message} ${target} gets 1 point, for encouragement!`
      karmaChange = 1
    }
  } else {
    message = chastisement[Math.floor(rand() * chastisement.length)] || ''
    if (rand() < 0.15) {
      message = `${message} ${target} loses 1 point, for hubris!`
      karmaChange = -1
    }
  }
  return { message, karmaChange }
}
