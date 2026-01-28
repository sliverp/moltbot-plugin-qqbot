import type { MoltbotPluginRuntime } from "moltbot/plugin-sdk";

let runtime: MoltbotPluginRuntime | null = null;

export function setQQBotRuntime(rt: MoltbotPluginRuntime) {
  runtime = rt;
}

export function getQQBotRuntime(): MoltbotPluginRuntime {
  if (!runtime) {
    throw new Error("QQBot runtime not initialized");
  }
  return runtime;
}
