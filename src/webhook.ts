import http from "node:http";
import type { ResolvedQQBotAccount, QQWebhookPayload, QQMessage, QQEventType } from "./types.js";
import { getQQBotRuntime } from "./runtime.js";
import { generateWebhookSignature } from "./auth.js";

const activeServers = new Map<string, http.Server>();

/**
 * 启动 Webhook 服务器
 */
export async function startQQBotWebhook(
  account: ResolvedQQBotAccount
): Promise<void> {
  if (activeServers.has(account.id)) {
    console.log(`[qqbot] Webhook server already running for ${account.id}`);
    return;
  }
  
  const port = account.config.webhookPort || 8080;
  const path = account.config.webhookPath || "/qqbot/webhook";
  
  const server = http.createServer(async (req, res) => {
    // 只处理 POST 请求到指定路径
    if (req.method !== "POST" || req.url !== path) {
      res.writeHead(404);
      res.end();
      return;
    }
    
    // 读取请求体
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    
    req.on("end", async () => {
      try {
        const payload: QQWebhookPayload = JSON.parse(body);
        
        // 处理验证请求 (op: 13)
        if (payload.op === 13) {
          const verifyData = payload.d;
          const signature = generateWebhookSignature({
            appSecret: account.config.appSecret!,
            eventTs: verifyData.event_ts,
            plainToken: verifyData.plain_token,
          });
          
          const response = {
            plain_token: verifyData.plain_token,
            signature,
          };
          
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
          
          console.log("[qqbot] Webhook verification successful");
          return;
        }
        
        // 处理事件 (op: 0)
        if (payload.op === 0) {
          await handleQQEvent(account, payload);
          
          res.writeHead(200);
          res.end();
          return;
        }
        
        // 未知 opcode
        res.writeHead(400);
        res.end();
      } catch (error) {
        console.error("[qqbot] Webhook error:", error);
        res.writeHead(500);
        res.end();
      }
    });
  });
  
  server.listen(port, () => {
    console.log(`[qqbot] Webhook server started on port ${port}, path ${path}`);
  });
  
  activeServers.set(account.id, server);
}

/**
 * 停止 Webhook 服务器
 */
export async function stopQQBotWebhook(accountId: string): Promise<void> {
  const server = activeServers.get(accountId);
  if (server) {
    server.close();
    activeServers.delete(accountId);
    console.log(`[qqbot] Webhook server stopped for ${accountId}`);
  }
}

/**
 * 处理 QQ 事件
 */
async function handleQQEvent(
  account: ResolvedQQBotAccount,
  payload: QQWebhookPayload
): Promise<void> {
  const runtime = getQQBotRuntime();
  const eventType = payload.t as QQEventType;
  const eventData = payload.d;
  
  console.log(`[qqbot] Received event: ${eventType}`);
  
  // 处理不同类型的消息事件
  switch (eventType) {
    case "C2C_MESSAGE_CREATE": // 单聊消息
      await handleDirectMessage(account, eventData, payload.id);
      break;
      
    case "GROUP_AT_MESSAGE_CREATE": // 群聊@消息
      await handleGroupMessage(account, eventData, payload.id);
      break;
      
    case "MESSAGE_CREATE": // 频道消息
      await handleChannelMessage(account, eventData, payload.id);
      break;
      
    case "DIRECT_MESSAGE_CREATE": // 频道私信
      await handleDMMessage(account, eventData, payload.id);
      break;
      
    default:
      console.log(`[qqbot] Unhandled event type: ${eventType}`);
  }
}

/**
 * 处理单聊消息
 */
async function handleDirectMessage(
  account: ResolvedQQBotAccount,
  data: any,
  eventId?: string
): Promise<void> {
  const runtime = getQQBotRuntime();
  
  try {
    await runtime.inbox.submit({
      channelId: "qqbot",
      accountId: account.id,
      chatId: `user:${data.author.user_openid}`,
      chatType: "direct",
      senderId: data.author.user_openid,
      messageId: data.id,
      text: data.content || "",
      timestamp: new Date(data.timestamp),
      metadata: {
        eventId,
        author: data.author,
      },
    });
  } catch (error) {
    console.error("[qqbot] Failed to submit direct message:", error);
  }
}

/**
 * 处理群聊消息
 */
async function handleGroupMessage(
  account: ResolvedQQBotAccount,
  data: any,
  eventId?: string
): Promise<void> {
  const runtime = getQQBotRuntime();
  
  try {
    await runtime.inbox.submit({
      channelId: "qqbot",
      accountId: account.id,
      chatId: `group:${data.group_openid}`,
      chatType: "group",
      senderId: data.author.member_openid,
      messageId: data.id,
      text: data.content || "",
      timestamp: new Date(data.timestamp),
      metadata: {
        eventId,
        groupOpenid: data.group_openid,
        author: data.author,
      },
    });
  } catch (error) {
    console.error("[qqbot] Failed to submit group message:", error);
  }
}

/**
 * 处理频道消息
 */
async function handleChannelMessage(
  account: ResolvedQQBotAccount,
  data: any,
  eventId?: string
): Promise<void> {
  const runtime = getQQBotRuntime();
  
  try {
    await runtime.inbox.submit({
      channelId: "qqbot",
      accountId: account.id,
      chatId: `channel:${data.channel_id}`,
      chatType: "channel",
      senderId: data.author.id,
      messageId: data.id,
      text: data.content || "",
      timestamp: new Date(data.timestamp),
      metadata: {
        eventId,
        channelId: data.channel_id,
        guildId: data.guild_id,
        author: data.author,
      },
    });
  } catch (error) {
    console.error("[qqbot] Failed to submit channel message:", error);
  }
}

/**
 * 处理频道私信
 */
async function handleDMMessage(
  account: ResolvedQQBotAccount,
  data: any,
  eventId?: string
): Promise<void> {
  const runtime = getQQBotRuntime();
  
  try {
    await runtime.inbox.submit({
      channelId: "qqbot",
      accountId: account.id,
      chatId: `dm:${data.guild_id}`,
      chatType: "direct",
      senderId: data.author.id,
      messageId: data.id,
      text: data.content || "",
      timestamp: new Date(data.timestamp),
      metadata: {
        eventId,
        guildId: data.guild_id,
        author: data.author,
      },
    });
  } catch (error) {
    console.error("[qqbot] Failed to submit DM message:", error);
  }
}
