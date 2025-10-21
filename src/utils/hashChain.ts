/**
 * TinyPay 哈希链工具函数
 * 用于生成支付所需的 SHA256 哈希链
 */

// ==================== 核心工具函数 ====================

/**
 * 🔑 关键函数：将 hex 字符串转换为 ASCII bytes
 * 注意：不是把 hex 转成二进制 bytes，而是把 hex 字符串的每个字符转成 ASCII 码
 * 这个函数用于后端参考，前端实际应该使用 hexToBytes
 */
export function hexToAsciiBytes(hexString: string): number[] {
  // 移除 0x 前缀（如果有）
  if (hexString.startsWith('0x') || hexString.startsWith('0X')) {
    hexString = hexString.slice(2);
  }
  
  const asciiBytes: number[] = [];
  
  // 将每个字符转换为其 ASCII 值
  for (let i = 0; i < hexString.length; i++) {
    asciiBytes.push(hexString.charCodeAt(i));
  }
  
  return asciiBytes;
}

/**
 * 🔑 将 hex 字符串转换为真正的二进制字节数组
 * 这个函数用于合约调用（Aptos 需要真正的字节，不是 ASCII）
 * 例如：'a1b2' -> [161, 178]（不是 [97, 49, 98, 50]）
 */
export function hexToBytes(hexString: string): number[] {
  // 移除 0x 前缀（如果有）
  if (hexString.startsWith('0x') || hexString.startsWith('0X')) {
    hexString = hexString.slice(2);
  }
  
  // 确保是偶数长度
  if (hexString.length % 2 !== 0) {
    throw new Error(`Hex string must have even length, got ${hexString.length}`);
  }
  
  const bytes: number[] = [];
  
  // 每 2 个字符转换为 1 个字节
  for (let i = 0; i < hexString.length; i += 2) {
    const byte = parseInt(hexString.slice(i, i + 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hex string at position ${i}: ${hexString.slice(i, i + 2)}`);
    }
    bytes.push(byte);
  }
  
  return bytes;
}

/**
 * 使用浏览器原生 Web Crypto API 计算 SHA256
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// ==================== 哈希链生成（完全复现 Python 逻辑）====================

export interface PaymentWorkflowResult {
  hashes: string[];           // 所有哈希值（用于后续支付）
  otpHex: string;            // 倒数第二个哈希（hex 格式）
  tailHex: string;           // 最后一个哈希（hex 格式）
  otpAsciiBytes: number[];   // OTP 的 ASCII bytes（后端用）
  tailAsciiBytes: number[];  // Tail 的 ASCII bytes（后端用）
  otpBytes: number[];        // OTP 的真实字节（合约用）
  tailBytes: number[];       // Tail 的真实字节（合约用）
  verificationOk: boolean;   // 验证是否通过
}

/**
 * 生成完整的支付哈希链
 * 这个函数完全复现 complete_workflow.py 的逻辑
 */
export async function completePaymentWorkflow(
  initialData: string,
  iterations: number = 1000
): Promise<PaymentWorkflowResult> {
  console.log('=== TinyPay Payment Workflow ===');
  console.log(`Initial data: ${initialData}`);
  console.log(`Iterations: ${iterations}`);
  
  // Step 1: 迭代哈希（复现 Python 逻辑）
  let current = initialData;
  const iterationResults: string[] = [];
  
  for (let i = 0; i < iterations; i++) {
    // ⚠️ 关键：第一次对原始字符串 hash，后续对 hex 字符串 hash
    const hash = await sha256(current);
    iterationResults.push(hash);
    
    if (i < 3 || i >= iterations - 3) {
      console.log(`Iteration ${i + 1}: ${hash}`);
    } else if (i === 3) {
      console.log('...');
    }
    
    // ⚠️ 关键：下一次迭代使用 hex 字符串（不是二进制 bytes）
    current = hash;
  }
  
  // Step 2: 准备合约参数
  const otpHex = iterations > 1 ? iterationResults[iterations - 2] : initialData;
  const tailHex = iterationResults[iterations - 1];
  
  // Step 3a: 转换为 ASCII bytes（后端参考用）
  const otpAsciiBytes = hexToAsciiBytes(otpHex);
  const tailAsciiBytes = hexToAsciiBytes(tailHex);
  
  // Step 3b: 转换为真实字节（合约调用用）
  const otpBytes = hexToBytes(otpHex);
  const tailBytes = hexToBytes(tailHex);
  
  // Step 4: 验证
  const verificationHash = await sha256(otpHex);
  const verificationOk = verificationHash === tailHex;
  
  console.log('\n=== Results ===');
  console.log(`otp (hex): ${otpHex}`);
  console.log(`tail (hex): ${tailHex}`);
  console.log(`\notp (ASCII bytes, for backend reference): [${otpAsciiBytes.slice(0, 10).join(',')}...] (length: ${otpAsciiBytes.length})`);
  console.log(`tail (ASCII bytes, for backend reference): [${tailAsciiBytes.slice(0, 10).join(',')}...] (length: ${tailAsciiBytes.length})`);
  console.log(`\notp (real bytes, for contract): [${otpBytes.slice(0, 10).join(',')}...] (length: ${otpBytes.length})`);
  console.log(`tail (real bytes, for contract): [${tailBytes.slice(0, 10).join(',')}...] (length: ${tailBytes.length})`);
  console.log(`\nVerification: ${verificationOk ? '✓ PASS' : '✗ FAIL'}`);
  
  return {
    hashes: iterationResults,
    otpHex,
    tailHex,
    otpAsciiBytes,
    tailAsciiBytes,
    otpBytes,
    tailBytes,
    verificationOk
  };
}

/**
 * 保存哈希链到本地存储
 */
export function saveHashChain(userAddress: string, hashes: string[]) {
  const hashChainData = {
    hashes: hashes,
    currentIndex: hashes.length - 1,  // 当前使用的是最后一个
    createdAt: Date.now()
  };
  
  localStorage.setItem(
    `hashChain_${userAddress}`,
    JSON.stringify(hashChainData)
  );
  
  console.log('✓ 哈希链已保存到本地存储');
}

/**
 * 从本地存储加载哈希链
 */
export function loadHashChain(userAddress: string): { hashes: string[], currentIndex: number, createdAt: number } | null {
  const data = localStorage.getItem(`hashChain_${userAddress}`);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('解析哈希链数据失败:', e);
    return null;
  }
}
