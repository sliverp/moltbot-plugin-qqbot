import type { ResolvedChannelAccount } from "moltbot/plugin-sdk";

/**
 * QQ Bot 配置
 */
export type QQBotConfig = {
  // QQ Bot 凭证（必需）
  appId?: string;        // 机器人 ID
  appSecret?: string;    // 机器人密钥（用于 API 鉴权和 Webhook 签名）
  
  // Webhook 配置
  webhookPort?: number;
  webhookPath?: string;
  webhookHost?: string;  // 服务器绑定地址，默认 0.0.0.0
  
  // 访问控制
  dmPolicy?: "open" | "pairing" | "allowlist";
  allowFrom?: string[];
  
  // 群组配置
  groups?: Record<string, {
    requireMention?: boolean;
    enabled?: boolean;
  }>;
  
  // 频道配置（如果使用频道功能）
  guilds?: Record<string, {
    channels?: string[];
    requireMention?: boolean;
  }>;
};

/**
 * 解析后的 QQ Bot 账户
 */
export type ResolvedQQBotAccount = ResolvedChannelAccount & {
  config: QQBotConfig;
  accessToken?: string;
  tokenExpiry?: number;
};

/**
 * QQ Bot 消息类型
 */
export enum QQMessageType {
  Text = 0,
  Markdown = 2,
  Ark = 3,
  Embed = 4,
  Media = 7,
}

/**
 * QQ Bot 事件类型
 */
export enum QQEventType {
  // 消息事件
  C2C_MESSAGE_CREATE = "C2C_MESSAGE_CREATE",           // 单聊消息
  GROUP_AT_MESSAGE_CREATE = "GROUP_AT_MESSAGE_CREATE", // 群聊@消息
  MESSAGE_CREATE = "MESSAGE_CREATE",                   // 频道消息
  DIRECT_MESSAGE_CREATE = "DIRECT_MESSAGE_CREATE",     // 频道私信
  
  // 互动事件
  MESSAGE_REACTION_ADD = "MESSAGE_REACTION_ADD",
  MESSAGE_REACTION_REMOVE = "MESSAGE_REACTION_REMOVE",
  
  // 成员事件
  GUILD_MEMBER_ADD = "GUILD_MEMBER_ADD",
  GUILD_MEMBER_REMOVE = "GUILD_MEMBER_REMOVE",
}

/**
 * QQ Bot Webhook 数据包
 */
export type QQWebhookPayload = {
  op: number;        // Opcode: 0=事件, 13=验证
  d: any;            // 数据载荷
  s?: number;        // 序列号
  t?: string;        // 事件类型
  id?: string;       // 事件ID
};

/**
 * QQ Bot 消息对象
 */
export type QQMessage = {
  id: string;
  author: {
    id: string;
    username?: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  
  // 群组信息
  group_openid?: string;
  group_id?: string;
  
  // 频道信息
  channel_id?: string;
  guild_id?: string;
  
  // 附件
  attachments?: Array<{
    url: string;
    content_type?: string;
    filename?: string;
  }>;
};

/**
 * 发送消息请求
 */
export type QQSendMessageRequest = {
  msg_type: QQMessageType;
  content?: string;
  media?: {
    file_info?: string; // 富媒体信息
  };
  markdown?: {
    content?: string;
  };
  msg_id?: string;      // 被动回复时需要
  event_id?: string;    // 被动回复时需要
  msg_seq?: number;     // 消息序号
};

/**
 * 发送消息响应
 */
export type QQSendMessageResponse = {
  id?: string;
  timestamp?: string;
  code?: number;
  message?: string;
};
