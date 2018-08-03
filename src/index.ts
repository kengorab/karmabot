import SlackBot from 'slackbots'
import express from 'express'
import dotenv from 'dotenv'
import repng from 'repng'
import * as React from 'react'
import { messageHandler } from './message-handler'
import HandlerContext from './context-manager'
import { Component } from './charting'
import {
  getRankedBucketedKarmaTargets,
  RankType,
  BucketType
} from './karma-dao'

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
app.get('/chart/top', async (req, res) => {
  try {
    // const data = [
    //   { name: 'Jan 2018', Ken: 40, Maggie: 24, Seth: 23, Guinness: 69 },
    //   { name: 'Feb 2018', Ken: 30, Maggie: 13, Seth: 15, Guinness: 55 },
    //   { name: 'Mar 2018', Ken: 20, Maggie: 98, Seth: 14, Guinness: 70 },
    //   { name: 'Apr 2018', Ken: 27, Maggie: 39, Seth: 24, Guinness: 8 },
    //   { name: 'May 2018', Ken: 18, Maggie: 48, Seth: 34, Guinness: 59 },
    //   { name: 'Jun 2018', Ken: 23, Maggie: 38, Seth: 1, Guinness: 58 },
    //   { name: 'Jul 2018', Ken: 34, Maggie: 43, Seth: 14, Guinness: 60 }
    // ]
    const data = await getRankedBucketedKarmaTargets(
      2,
      25,
      RankType.TOP,
      BucketType.DAILY
    )
    console.log(data)
    const stream = await repng(
      () =>
        React.createElement(Component, {
          width: 800,
          height: 400,
          data,
          xAxisKey: 'name'
        }),
      { width: 800, height: 400 }
    )
    res.set('Content-Type', 'image/png')
    stream.pipe(res)
  } catch (e) {
    res.status(500).send({ error: e })
  }
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Server listening on :${port}...`))

// Build and configure bot
const bot = new SlackBot({
  token: token as string,
  name: BOT_NAME
})

const context = new HandlerContext(bot)

bot.on('message', messageHandler.bind(null, context))
