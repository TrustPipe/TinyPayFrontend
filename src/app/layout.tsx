import type { Metadata } from "next";
import '@solana/wallet-adapter-react-ui/styles.css';
import "./globals.css";
import { SolanaProvider } from "@/context/SolanaProvider";

export const metadata: Metadata = {
  title: "TinyPay",
  description: "Pay offline, settle on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SolanaProvider>
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}
