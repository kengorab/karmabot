import SlackBot from 'slackbots'
import express from 'express'
import dotenv from 'dotenv'
import { messageHandler } from './message-handler'
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

// Tiny express server to report health
const app = express()
app.get('/healthCheck', (req, res) => res.send({ status: 'ok' }))

const port = process.env.PORT || 4000
app.listen(port, () => console.log('Server listening on :4000...'))

// Build and configure bot
const bot = new SlackBot({
  token: token as string,
  name: BOT_NAME
})

const context = new HandlerContext(bot)

bot.on('message', messageHandler.bind(null, context))
