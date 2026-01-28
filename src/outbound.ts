import type {
  ChannelOutboundAdapter,
  OutboundSendTextParams,
  OutboundSendMediaParams,
  SendResult,
} from "moltbot/plugin-sdk";
import type {
  ResolvedQQBotAccount,
  QQMessageType,
  QQSendMessageRequest,
  QQSendMessageResponse,
} from "./types.js";
import { getAccessToken } from "./auth.js";

// Access Token 缓存
const tokenCache = new Map<string, { token: string; expiry: number }>();

/**
 * 获取或刷新 Access Token
 */
async function ensureAccessToken(account: ResolvedQQBotAccount): Promise<string> {
  const cacheKey = account.config.appId!;
  const cached = tokenCache.get(cacheKey);
  
  // 检查缓存是否有效（提前 5 分钟刷新）
  if (cached && cached.expiry > Date.now() + 5 * 60 * 1000) {
    return cached.token;
  }
  
  // 获取新 token
  const { accessToken, expiresIn } = await getAccessToken({
    appId: account.config.appId!,
    clientSecret: account.config.appSecret!,
  });
  
  tokenCache.set(cacheKey, {
    token: accessToken,
    expiry: Date.now() + expiresIn * 1000,
  });
  
  return accessToken;
}

/**
 * API 基础 URL
 */
const API_BASE_URL = "https://api.sgroup.qq.com";

/**
 * 发送消息到 QQ
 */
async function sendQQMessage(params: {
  account: ResolvedQQBotAccount;
  endpoint: string;
  body: QQSendMessageRequest;
}): Promise<QQSendMessageResponse> {
  const { account, endpoint, body } = params;
  
  const accessToken = await ensureAccessToken(account);
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `QQBot ${accessToken}`,
      "X-Union-Appid": account.config.appId!,
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `QQ API error (${response.status}): ${errorText}`
    );
  }
  
  return await response.json() as QQSendMessageResponse;
}

/**
 * 解析目标类型和 ID
 */
function parseTarget(targetId: string): {
  type: "user" | "group" | "channel" | "dm";
  id: string;
} {
  // 格式示例：
  // user:openid
  // group:group_openid
  // channel:channel_id
  // dm:guild_id
  
  if (targetId.includes(":")) {
    const [type, id] = targetId.split(":", 2);
    return {
      type: type as "user" | "group" | "channel" | "dm",
      id,
    };
  }
  
  // 默认为用户
  return { type: "user", id: targetId };
}

/**
 * Outbound 适配器
 */
export const qqBotOutboundAdapter: ChannelOutboundAdapter = {
  sendText: async (params: OutboundSendTextParams): Promise<SendResult> => {
    const { account, target, text, options } = params;
    const qqAccount = account as ResolvedQQBotAccount;
    
    try {
      const { type, id } = parseTarget(target.id);
      
      let endpoint: string;
      switch (type) {
        case "user":
          endpoint = `/v2/users/${id}/messages`;
          break;
        case "group":
          endpoint = `/v2/groups/${id}/messages`;
          break;
        case "channel":
          endpoint = `/channels/${id}/messages`;
          break;
        case "dm":
          endpoint = `/dms/${id}/messages`;
          break;
        default:
          throw new Error(`Unknown target type: ${type}`);
      }
      
      const body: QQSendMessageRequest = {
        msg_type: 0, // 文本消息
        content: text,
        msg_id: options?.replyToId,
        event_id: options?.metadata?.eventId as string | undefined,
      };
      
      const result = await sendQQMessage({
        account: qqAccount,
        endpoint,
        body,
      });
      
      return {
        ok: true,
        messageId: result.id,
      };
    } catch (error) {
      console.error("[qqbot] Failed to send text message:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  sendMedia: async (params: OutboundSendMediaParams): Promise<SendResult> => {
    const { account, target, media, options } = params;
    const qqAccount = account as ResolvedQQBotAccount;
    
    try {
      const { type, id } = parseTarget(target.id);
      
      let endpoint: string;
      switch (type) {
        case "user":
          endpoint = `/v2/users/${id}/messages`;
          break;
        case "group":
          endpoint = `/v2/groups/${id}/messages`;
          break;
        case "channel":
          endpoint = `/channels/${id}/messages`;
          break;
        default:
          throw new Error(`Media not supported for target type: ${type}`);
      }
      
      // QQ Bot 需要先上传媒体文件获取 file_info
      // 这里简化处理，实际需要调用上传接口
      const firstMedia = media[0];
      if (!firstMedia) {
        return { ok: false, error: "No media provided" };
      }
      
      const body: QQSendMessageRequest = {
        msg_type: 7, // 富媒体消息
        media: {
          file_info: firstMedia.url, // 实际应该是上传后的 file_info
        },
        content: firstMedia.caption || "",
        msg_id: options?.replyToId,
      };
      
      const result = await sendQQMessage({
        account: qqAccount,
        endpoint,
        body,
      });
      
      return {
        ok: true,
        messageId: result.id,
      };
    } catch (error) {
      console.error("[qqbot] Failed to send media message:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
