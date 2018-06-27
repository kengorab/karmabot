import SlackBot, { PostMessageParams, Channel } from 'slackbots'
import { keyBy, Dictionary } from 'lodash'
import * as KarmaDao from './karma-dao'

const params: PostMessageParams = {
  icon_emoji: ':scale:',
  as_user: true
}

export default class HandlerContext {
  private static channels: Promise<Dictionary<Channel>>

  constructor(public readonly bot: SlackBot) {
    HandlerContext.channels = bot
      .getChannels()
      .then(({ channels }) => keyBy(channels, 'id'))
  }

  public log = (...args: any[]) => console.log(...args)

  public getParams = () => params

  public async getChannel(id: string): Promise<Channel> {
    const channels = await HandlerContext.channels
    return channels[id]
  }

  public async modifyKarma(
    target: string,
    amount: number,
    actor: string
  ): Promise<number> {
    await KarmaDao.modifyKarma(target, amount, actor)
    const { total } = await KarmaDao.getKarmaTarget(target)
    return total
  }
}
