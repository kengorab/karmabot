import SlackBot from 'slackbots'
import dotenv from 'dotenv'
import { keyBy } from 'lodash'
import { messageHandler } from './message-handler'

// Load in .env file
dotenv.config()

const bot = new SlackBot({
  token: process.env.TOKEN as string,
  name: 'karmabot'
})

const params = { icon_emoji: ':scale:' }

const channels = bot.getChannels().then(({ channels }) => keyBy(channels, 'id'))

const karma: { [target: string]: number } = {}

const handlerConfig = {
  bot,
  log: (...args: any[]) => console.log(...args),
  getParams: () => params,
  getChannel: async (id: string) => (await channels)[id],
  modifyKarma: (target: string, amount: number) => {
    const oldVal = karma[target] || 0
    karma[target] = oldVal + amount
    return karma[target]
  }
}

bot.on('message', messageHandler.bind(null, handlerConfig))
