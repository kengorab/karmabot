import SlackBot, { PostMessageParams, Channel } from 'slackbots'

export interface HandlerConfig {
  bot: SlackBot
  log: (...args: any[]) => void
  getParams: () => PostMessageParams
  getChannel: (id: string) => Promise<Channel | null>
  modifyKarma: (target: string, amount: number) => number
}
