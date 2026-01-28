import type { ChannelOnboardingAdapter } from "moltbot/plugin-sdk";

/**
 * QQ Bot onboarding adapter - 引导用户配置 QQ Bot 凭证
 */
export const qqBotOnboardingAdapter: ChannelOnboardingAdapter = {
  /**
   * 开始配置向导
   */
  async start({ prompts, cfg }) {
    // 询问 Bot AppID
    const appId = await prompts.text({
      message: "请输入你的 QQ Bot AppID（机器人ID）",
      placeholder: "例如: 102146862",
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return "AppID 不能为空";
        }
        if (!/^\d+$/.test(value.trim())) {
          return "AppID 应该是纯数字";
        }
        return true;
      },
    });

    if (!appId) {
      throw new Error("未提供 AppID");
    }

    // 询问 App Secret
    const appSecret = await prompts.password({
      message: "请输入你的 QQ Bot App Secret（机器人密钥）",
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return "App Secret 不能为空";
        }
        if (value.trim().length < 16) {
          return "App Secret 长度不足，请检查是否正确";
        }
        return true;
      },
    });

    if (!appSecret) {
      throw new Error("未提供 App Secret");
    }

    // 询问 Webhook 端口
    const webhookPortStr = await prompts.text({
      message: "Webhook 监听端口",
      placeholder: "默认: 8080",
      default: "8080",
      validate: (value) => {
        const port = Number.parseInt(value, 10);
        if (!Number.isFinite(port) || port < 1 || port > 65535) {
          return "端口号必须在 1-65535 之间";
        }
        return true;
      },
    });

    const webhookPort = Number.parseInt(webhookPortStr || "8080", 10);

    // 询问 Webhook 路径
    const webhookPath = await prompts.text({
      message: "Webhook 路径",
      placeholder: "默认: /qqbot/webhook",
      default: "/qqbot/webhook",
      validate: (value) => {
        if (!value.startsWith("/")) {
          return "路径必须以 / 开头";
        }
        return true;
      },
    });

    // 询问是否是沙箱环境
    const sandbox = await prompts.confirm({
      message: "是否使用沙箱环境？（正式环境选 No）",
      default: false,
    });

    // 配置私聊策略
    const dmPolicy = await prompts.select({
      message: "私聊消息策略",
      choices: [
        { value: "pairing", label: "配对模式（需要手动批准用户）" },
        { value: "open", label: "开放模式（所有用户都可以私聊）" },
        { value: "closed", label: "关闭模式（不接受私聊）" },
      ],
      default: "pairing",
    });

    // 应用配置
    if (!cfg.channels) cfg.channels = {};
    if (!cfg.channels.qqbot) cfg.channels.qqbot = {};

    cfg.channels.qqbot.enabled = true;
    cfg.channels.qqbot.appId = appId.trim();
    cfg.channels.qqbot.appSecret = appSecret.trim();
    cfg.channels.qqbot.webhookPort = webhookPort;
    cfg.channels.qqbot.webhookPath = webhookPath || "/qqbot/webhook";
    cfg.channels.qqbot.sandbox = sandbox;
    cfg.channels.qqbot.dmPolicy = dmPolicy as "pairing" | "open" | "closed";

    // 显示配置完成信息
    const webhookUrl = `http://your-domain:${webhookPort}${webhookPath}`;
    
    return {
      success: true,
      message: [
        "✅ QQ Bot 配置完成！",
        "",
        "📝 下一步操作：",
        "1. 确保你的服务器可以被公网访问",
        `2. 在 QQ 开放平台配置 Webhook URL: ${webhookUrl}`,
        "3. 重启 gateway: clawdbot gateway restart",
        "",
        "📚 获取凭证：https://q.qq.com/",
        "📖 文档：https://bot.q.qq.com/wiki/",
      ].join("\n"),
    };
  },
};
