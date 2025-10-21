/**
 * Solana Network 配置
 */

import { PublicKey } from '@solana/web3.js';

// TinyPay 程序地址
export const PROGRAM_ID = new PublicKey('88oZkwPMg9iWjPTUqYJXkRE2JYmFEvRraC6vYTcH9CGH');

// RPC 端点
export const RPC_ENDPOINT = 'https://api.devnet.solana.com';

// 代币配置
export interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  isNative?: boolean;
  mint?: PublicKey;
}

export const SUPPORTED_TOKENS: Record<string, TokenConfig> = {
  SOL: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    isNative: true,
  },
};

/**
 * 将用户输入的金额转换为 lamports
 */
export function amountToLamports(amount: number, tokenSymbol: string = 'SOL'): number {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  if (!token) {
    throw new Error(`Unknown token: ${tokenSymbol}`);
  }
  return Math.floor(amount * Math.pow(10, token.decimals));
}

/**
 * 将 lamports 转换为用户可读金额
 */
export function lamportsToAmount(lamports: number, tokenSymbol: string = 'SOL'): number {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  if (!token) {
    throw new Error(`Unknown token: ${tokenSymbol}`);
  }
  return lamports / Math.pow(10, token.decimals);
}
