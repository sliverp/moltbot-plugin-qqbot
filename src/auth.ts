import crypto from "node:crypto";

/**
 * 获取 Access Token
 * API: https://bots.qq.com/app/getAppAccessToken
 */
export async function getAccessToken(params: {
  appId: string;
  clientSecret: string;
}): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch("https://bots.qq.com/app/getAppAccessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      appId: params.appId,
      clientSecret: params.clientSecret,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }
  
  const data = await response.json() as {
    access_token?: string;
    expires_in?: number;
  };
  
  if (!data.access_token) {
    throw new Error(`No access token in response: ${JSON.stringify(data)}`);
  }
  
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 7200,
  };
}

/**
 * 验证 Webhook 签名
 * 使用 Ed25519 算法
 * @param appSecret - 机器人密钥（AppSecret）
 */
export function verifyWebhookSignature(params: {
  appSecret: string;
  eventTs: string;
  plainToken: string;
  signature: string;
}): boolean {
  const { appSecret, eventTs, plainToken, signature } = params;
  
  try {
    // 准备种子（需要满足 32 字节）
    let seed = appSecret;
    while (seed.length < 32) {
      seed = seed + appSecret;
    }
    seed = seed.substring(0, 32);
    
    // 生成密钥对
    const keyPair = crypto.generateKeyPairSync("ed25519", {
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKey: Buffer.from(seed, "utf-8"),
    });
    
    // 拼接消息
    const message = eventTs + plainToken;
    
    // 计算签名
    const computedSignature = crypto
      .sign(null, Buffer.from(message, "utf-8"), {
        key: keyPair.privateKey,
        format: "pem",
        type: "pkcs8",
      })
      .toString("hex");
    
    return computedSignature === signature;
  } catch (error) {
    console.error("[qqbot] Signature verification error:", error);
    return false;
  }
}

/**
 * 生成 Webhook 验证响应签名
 * @param appSecret - 机器人密钥（AppSecret）
 */
export function generateWebhookSignature(params: {
  appSecret: string;
  eventTs: string;
  plainToken: string;
}): string {
  const { appSecret, eventTs, plainToken } = params;
  
  // 准备种子（需要满足 32 字节）
  let seed = appSecret;
  while (seed.length < 32) {
    seed = seed + appSecret;
  }
  seed = seed.substring(0, 32);
  
  // Node.js 中 Ed25519 签名的简化实现
  // 注意：这里使用了内置的 crypto 模块
  const message = eventTs + plainToken;
  
  // 使用 HMAC-SHA256 作为简化方案（如果需要严格的 Ed25519，需要额外的库）
  // 实际生产环境建议使用 tweetnacl 或 @noble/ed25519
  const hmac = crypto.createHmac("sha256", seed);
  hmac.update(message);
  return hmac.digest("hex");
}
