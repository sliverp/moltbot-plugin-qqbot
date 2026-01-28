# 构建说明

## 问题说明

由于这是独立插件仓库，需要 `moltbot` 包提供类型定义。但目前有以下问题：

1. `moltbot` 包需要先构建（`npm run build`）
2. `moltbot` 使用 `pnpm` 而不是 `npm`
3. 类型导入路径需要配置

## 解决方案

### 方案 1：使用已发布的 moltbot 包（推荐）

等待 moltbot 发布到 npm 后：

```bash
cd /data/workspace/moltbot-plugin-qqbot
npm install --save-dev moltbot@latest
npm run build
```

### 方案 2：本地构建 moltbot

```bash
# 1. 安装 pnpm（如果还没有）
npm install -g pnpm

# 2. 构建 moltbot
cd /data/workspace/moltbot
pnpm install
pnpm run build

# 3. 链接到插件
cd /data/workspace/moltbot-plugin-qqbot
npm install --save-dev ../moltbot
npm run build
```

### 方案 3：跳过类型检查（临时方案）

如果只是为了测试功能，可以暂时跳过类型检查：

```bash
cd /data/workspace/moltbot-plugin-qqbot
npm run build -- --skipLibCheck
```

或修改 `tsconfig.json` 添加：
```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "noEmit": false
  }
}
```

## 当前状态

目前 `moltbot` 还未构建，所以无法编译插件。

**建议**：等待 moltbot 正式发布到 npm 后再进行构建和测试。

或者使用方案 3 跳过类型检查进行初步测试。
