import type { ChannelPlugin, MoltbotConfig } from "moltbot/plugin-sdk";
import type { ResolvedQQBotAccount } from "./types.js";
import {
  listQQBotAccountIds,
  resolveQQBotAccount,
  resolveDefaultQQBotAccountId,
  isQQBotConfigured,
} from "./config.js";
import { qqBotOutboundAdapter } from "./outbound.js";
import { startQQBotWebhook, stopQQBotWebhook } from "./webhook.js";
import { qqBotOnboardingAdapter } from "./onboarding.js";

export const qqBotPlugin: ChannelPlugin<ResolvedQQBotAccount> = {
  id: "qqbot",
  
  // Onboarding 配置向导
  onboarding: qqBotOnboardingAdapter,
  
  // 元数据
  meta: {
    id: "qqbot",
    label: "QQ Bot",
    selectionLabel: "QQ Bot (官方机器人 Webhook)",
    docsPath: "/channels/qqbot",
    blurb: "QQ官方机器人平台，使用Webhook接收消息，支持单聊、群聊和频道",
    systemImage: "message.fill",
  },
  
  // 功能声明
  capabilities: {
    chatTypes: ["direct", "group", "channel"],
    reactions: false,
    threads: false,
    media: true,
    polls: false,
    nativeCommands: false,
    blockStreaming: false,
  },
  
  // 配置重载规则
  reload: {
    configPrefixes: ["channels.qqbot"],
  },
  
  // 配置适配器
  config: {
    listAccountIds: (cfg: MoltbotConfig) => listQQBotAccountIds(cfg),
    
    resolveAccount: (cfg: MoltbotConfig, accountId: string) =>
      resolveQQBotAccount({ cfg, accountId }),
    
    defaultAccountId: (cfg: MoltbotConfig) => resolveDefaultQQBotAccountId(cfg),
    
    isConfigured: (account: ResolvedQQBotAccount) => isQQBotConfigured(account),
    
    describeAccount: (account: ResolvedQQBotAccount) => {
      const lines: string[] = [];
      
      lines.push(`AppID: ${account.config.appId ? "✓" : "✗"}`);
      lines.push(`AppSecret: ${account.config.appSecret ? "✓" : "✗"}`);
      lines.push(`AppSecret: ${account.config.appSecret ? "✓" : "✗"}`);
      lines.push(`Webhook: ${account.config.webhookPort}${account.config.webhookPath}`);
      lines.push(`DM Policy: ${account.config.dmPolicy}`);
      
      return {
        accountId: account.id,
        enabled: account.enabled,
        configured: isQQBotConfigured(account),
        lines,
      };
    },
    
    setAccountEnabled: ({ cfg, accountId, enabled }: {
      cfg: MoltbotConfig;
      accountId: string;
      enabled: boolean;
    }) => {
      if (!cfg.channels) cfg.channels = {};
      if (!cfg.channels.qqbot) cfg.channels.qqbot = {};
      
      if (cfg.channels.qqbot.accounts?.[accountId]) {
        cfg.channels.qqbot.accounts[accountId].enabled = enabled;
      } else {
        cfg.channels.qqbot.enabled = enabled;
      }
    },
    
    deleteAccount: ({ cfg, accountId }: {
      cfg: MoltbotConfig;
      accountId: string;
    }) => {
      if (cfg.channels?.qqbot?.accounts) {
        delete cfg.channels.qqbot.accounts[accountId];
      }
    },
  },
  
  // 安全策略
  security: {
    resolveDmPolicy: ({ account }: { account: ResolvedQQBotAccount }) => ({
      policy: account.config.dmPolicy ?? "pairing",
      allowFrom: account.config.allowFrom ?? [],
      policyPath: "channels.qqbot.dmPolicy",
      allowFromPath: "channels.qqbot.allowFrom",
      approveHint: "Run: moltbot channels pairing approve qqbot <user_openid>",
    }),
  },
  
  // 群组管理
  groups: {
    resolveRequireMention: ({ account, chatId }: {
      account: ResolvedQQBotAccount;
      chatId: string;
    }) => {
      // 从 chatId 中提取 group_openid
      const groupId = chatId.replace(/^group:/, "");
      return account.config.groups?.[groupId]?.requireMention ?? true;
    },
  },
  
  // 出站消息
  outbound: qqBotOutboundAdapter,
  
  // Gateway 管理
  gateway: {
    startAccount: async ({ account }: { account: ResolvedQQBotAccount }) => {
      console.log(`[qqbot] Starting account: ${account.id}`);
      await startQQBotWebhook(account);
    },
    
    stopAccount: async ({ account }: { account: ResolvedQQBotAccount }) => {
      console.log(`[qqbot] Stopping account: ${account.id}`);
      await stopQQBotWebhook(account.id);
    },
    
    getAccountStatus: async ({ account }: { account: ResolvedQQBotAccount }) => {
      // TODO: 实现实际的状态检查
      return {
        connected: true,
        details: {
          webhookPort: account.config.webhookPort,
          webhookPath: account.config.webhookPath,
        },
      };
    },
  },
  
  // 消息目标解析
  messaging: {
    normalizeTarget: (target: string) => {
      // 保留格式：user:xxx, group:xxx, channel:xxx
      return target;
    },
    targetResolver: {
      looksLikeId: (id: string) => {
        return /^(user|group|channel|dm):.+$/.test(id);
      },
      hint: "user:<openid> | group:<group_openid> | channel:<channel_id>",
    },
  },
  
  // 配对机制
  pairing: {
    idLabel: "QQ User OpenID",
    normalizeAllowEntry: (entry: string) => {
      // 清理前缀
      return entry.replace(/^(qq|qqbot|user):/i, "");
    },
  },
};
