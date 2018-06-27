import SlackBot from 'slackbots'
import dotenv from 'dotenv'
import { keyBy } from 'lodash'
import { messageHandler } from './message-handler'
import * as KarmaDao from './karma-dao'
import HandlerContext from './context-manager'

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

const context = new HandlerContext(bot)

bot.on('message', messageHandler.bind(null, context))
