"use client";

import { PropsWithChildren } from "react";
import { WagmiProvider as WagmiProviderBase, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, lightTheme } from "@rainbow-me/rainbowkit";
import { u2uNetwork } from "@/config/u2u";

import "@rainbow-me/rainbowkit/styles.css";

// 创建 Wagmi 配置
const config = getDefaultConfig({
  appName: "TinyPay",
  projectId: "YOUR_PROJECT_ID", // 从 https://cloud.walletconnect.com/ 获取
  chains: [u2uNetwork],
  transports: {
    [u2uNetwork.id]: http(),
  },
  ssr: true, // 支持服务端渲染
});

// 创建 React Query 客户端
const queryClient = new QueryClient();

export function WagmiProvider({ children }: PropsWithChildren) {
  return (
    <WagmiProviderBase config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          locale="en-US"
          modalSize="compact"
          theme={lightTheme({
            accentColor: '#91C8CA',
            accentColorForeground: 'white',
            borderRadius: 'large',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProviderBase>
  );
}

