/**
 * U2U Network 配置
 */

import { defineChain } from 'viem';

// 定义 U2U 网络
export const u2uNetwork = defineChain({
  id: 39,
  name: 'U2U Network',
  network: 'u2u',
  nativeCurrency: {
    decimals: 18,
    name: 'U2U',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mainnet.u2u.xyz/'],
    },
    public: {
      http: ['https://rpc-mainnet.u2u.xyz/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'U2U Explorer',
      url: 'https://u2uscan.xyz',
    },
  },
  testnet: false,
});

// ==================== 合约配置 ====================

// TinyPay 合约地址
export const TINYPAY_CONTRACT_ADDRESS = '0x4690cb265bc3c12fd218670dfbdc4571d2c5a6b5' as const;

// 原生代币地址（用于合约调用）
export const NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// ERC20 代币配置
export interface TokenConfig {
  name: string;
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative?: boolean;
}

export const SUPPORTED_TOKENS: Record<string, TokenConfig> = {
  U2U: {
    name: 'U2U',
    symbol: 'U2U',
    address: NATIVE_TOKEN_ADDRESS,
    decimals: 18,
    isNative: true,
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    address: '0x665f693241e680c4171F01d90AbEa500af42F9FF',
    decimals: 6,
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    address: '0x0820957B320E901622385Cc6C4fca196b20b939F',
    decimals: 6,
  },
};

// TinyPay 合约 ABI（只包含需要的函数）
export const TINYPAY_ABI = [
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'tail', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

// ERC20 标准 ABI（只包含 approve 函数）
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * 将用户输入的金额转换为合约所需的 wei/最小单位
 */
export function amountToWei(amount: number, tokenSymbol: string): bigint {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  if (!token) {
    throw new Error(`Unknown token: ${tokenSymbol}`);
  }
  // 使用 BigInt 避免精度问题
  const factor = BigInt(10 ** token.decimals);
  const amountStr = amount.toFixed(token.decimals);
  const [integer, decimal = ''] = amountStr.split('.');
  const paddedDecimal = decimal.padEnd(token.decimals, '0');
  return BigInt(integer) * factor + BigInt(paddedDecimal);
}

/**
 * 将合约返回的 wei/最小单位转换为用户可读金额
 */
export function weiToAmount(wei: bigint, tokenSymbol: string): number {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  if (!token) {
    throw new Error(`Unknown token: ${tokenSymbol}`);
  }
  const factor = BigInt(10 ** token.decimals);
  const result = Number(wei) / Number(factor);
  return result;
}

