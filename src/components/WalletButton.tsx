"use client";

import dynamic from 'next/dynamic';

// 动态导入钱包按钮，禁用 SSR 避免 hydration 错误
const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

/**
 * Wallet connection button component
 * Uses Solana Wallet Adapter
 */
export function WalletButton() {
  return (
    <WalletMultiButtonDynamic
      className="!bg-gradient-to-r !from-[#F2B92C]/25 !via-[#F2B92C]/20 !to-[#6B9EF5]/20 !backdrop-blur-xl !border !border-[#F2B92C]/40 !px-4 !py-2 !text-xs !font-semibold !text-slate-800 !shadow-md !shadow-[#F2B92C]/20 hover:!shadow-lg hover:!shadow-[#F2B92C]/30 !transition-all !rounded-full"
    />
  );
}
