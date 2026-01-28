import type { MoltbotConfig } from "moltbot/plugin-sdk";
import type { ResolvedQQBotAccount } from "./types.js";

export function listQQBotAccountIds(cfg: MoltbotConfig): string[] {
  const channelCfg = cfg.channels?.qqbot;
  if (!channelCfg?.enabled) return [];
  
  // 支持多账户
  if (channelCfg.accounts) {
    return Object.keys(channelCfg.accounts).filter(
      id => channelCfg.accounts?.[id]?.enabled !== false
    );
  }
  
  // 单账户模式
  return ["main"];
}

export function resolveQQBotAccount(params: {
  cfg: MoltbotConfig;
  accountId: string;
}): ResolvedQQBotAccount | null {
  const { cfg, accountId } = params;
  const channelCfg = cfg.channels?.qqbot;
  
  if (!channelCfg) return null;
  
  // 多账户模式
  if (channelCfg.accounts?.[accountId]) {
    const accountCfg = channelCfg.accounts[accountId];
    return {
      id: accountId,
      channelId: "qqbot",
      enabled: accountCfg.enabled ?? true,
      config: {
        appId: accountCfg.appId,
        appSecret: accountCfg.appSecret,
        webhookPort: accountCfg.webhookPort,
        webhookPath: accountCfg.webhookPath,
        webhookHost: accountCfg.webhookHost,
        dmPolicy: accountCfg.dmPolicy ?? channelCfg.dmPolicy ?? "pairing",
        allowFrom: accountCfg.allowFrom ?? channelCfg.allowFrom ?? [],
        groups: accountCfg.groups ?? {},
        guilds: accountCfg.guilds ?? {},
      },
    };
  }
  
  // 单账户模式
  return {
    id: accountId,
    channelId: "qqbot",
    enabled: channelCfg.enabled ?? false,
    config: {
      appId: channelCfg.appId,
      appSecret: channelCfg.appSecret,
      webhookPort: channelCfg.webhookPort ?? 8080,
      webhookPath: channelCfg.webhookPath ?? "/qqbot/webhook",
      webhookHost: channelCfg.webhookHost ?? "0.0.0.0",
      dmPolicy: channelCfg.dmPolicy ?? "pairing",
      allowFrom: channelCfg.allowFrom ?? [],
      groups: channelCfg.groups ?? {},
      guilds: channelCfg.guilds ?? {},
    },
  };
}

export function resolveDefaultQQBotAccountId(cfg: MoltbotConfig): string {
  const accountIds = listQQBotAccountIds(cfg);
  return accountIds[0] ?? "main";
}

export function isQQBotConfigured(account: ResolvedQQBotAccount): boolean {
  return Boolean(
    account.config.appId?.trim() &&
    account.config.appSecret?.trim()
  );
}
