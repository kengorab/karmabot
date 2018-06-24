import SlackBot from 'slackbots'
import dotenv from 'dotenv'
import { keyBy } from 'lodash'
import { messageHandler } from './message-handler'

const BOT_NAME = 'karmabot'

// Load in .env file, and extract TOKEN value
const { error } = dotenv.config()
if (error) {
  console.error(`Could not start ${BOT_NAME} due to lack of .env file:`, error)
  process.exit(1)
}
const { TOKEN: token } = process.env
if (!token) {
  console.error(`Could not start ${BOT_NAME} due to missing TOKEN value`)
  process.exit(1)
}

const bot = new SlackBot({
  token: token as string,
  name: BOT_NAME
})

const params = { icon_emoji: ':scale:', as_user: true }

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
