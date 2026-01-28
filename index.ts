import type { MoltbotPluginApi } from "moltbot/plugin-sdk";
import { qqBotPlugin } from "./src/channel.js";
import { setQQBotRuntime } from "./src/runtime.js";

const plugin = {
  id: "moltbot-plugin-qqbot",
  name: "QQ Bot Plugin",
  description: "QQ Bot (官方机器人) integration for Moltbot using Webhook",
  configSchema: {
    type: "object",
    properties: {
      debug: {
        type: "boolean",
        description: "Enable debug logging",
        default: false,
      },
    },
  },
  
  register(api: MoltbotPluginApi) {
    // 保存 runtime 引用
    setQQBotRuntime(api.runtime);
    
    // 注册 channel
    api.registerChannel({ plugin: qqBotPlugin });
    
    api.logger.info("[qqbot] QQ Bot plugin registered successfully");
  },
};

export default plugin;
