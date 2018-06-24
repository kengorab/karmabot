declare module 'slackbots' {
  interface SlackBotOptions {
    token: string
    name: string
  }

  interface PostMessageParams {
    icon_emoji: string
    as_user?: boolean
  }

  interface MessageEvent {
    text: string
    type: 'message'
    subtype: 'bot_message'
    team: string
    channel: string
    event_ts: string
    ts: string
    user?: string
    username?: string
    icons?: { emoji: string }
    bot_id?: string
  }

  interface TopicOrPurpose {
    value: string
    creator: string
    last_set: number
  }

  interface Channel {
    id: string
    name: string
    is_channel: boolean
    created: number
    is_archived: boolean
    is_general: boolean
    unlinked: number
    creator: string
    name_normalized: string
    is_shared: boolean
    is_org_shared: boolean
    is_member: boolean
    is_private: boolean
    is_mpim: boolean
    members: string[]
    topic: TopicOrPurpose
    purpose: TopicOrPurpose
    previous_names: string[]
    num_members: number
  }

  interface GetChannelsResponse {
    ok: boolean
    channels: Channel[]
  }

  interface UserProfile {
    title: string
    phone: string
    skype: string
    real_name: string
    real_name_normalized: string
    display_name: string
    display_name_normalized: string
    status_text: string
    status_emoji: string
    status_expiration: number
    avatar_hash: string
    email: string
    image_24: string
    image_32: string
    image_48: string
    image_72: string
    image_192: string
    image_512: string
    status_text_canonical: string
    team: string
  }

  interface User {
    id: string
    team_id: string
    name: string
    deleted: boolean
    color: string
    real_name: string
    tz: string
    tz_label: string
    tz_offset: number
    profile: UserProfile
    is_admin: boolean
    is_owner: boolean
    is_primary_owner: boolean
    is_restricted: boolean
    is_ultra_restricted: boolean
    is_bot: boolean
    updated: number
    is_app_user: boolean
  }

  interface GetUsersResponse {
    ok: boolean
    members: User[]
  }

  export default class SlackBot {
    public token: string
    public name: string

    constructor(opts: SlackBotOptions)

    public on(event: string, cb: (data: any) => void): void
    public on(event: 'message', cb: (data: MessageEvent) => void): void

    public postMessageToChannel(
      channel: string,
      message: string,
      params: PostMessageParams
    ): void

    public getChannels(): Promise<GetChannelsResponse>
    public getUsers(): Promise<GetUsersResponse>
  }
}
