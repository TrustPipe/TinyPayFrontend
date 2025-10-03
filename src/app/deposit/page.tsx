"use client";

import dynamic from "next/dynamic";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { aptosClient } from "@/utils/aptosClient";

const WalletButton = dynamic(
  () => import("@/components/WalletButton").then(mod => ({ default: mod.WalletButton })),
  { ssr: false }
);

const DepositForm = dynamic(
  () => import("@/components/DepositForm").then(mod => ({ default: mod.DepositForm })),
  { ssr: false }
);

export default function Deposit() {
  const { connected, account, network } = useWallet();
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);

  // Fetch balance when wallet is connected
  useEffect(() => {
    if (!account?.address) {
      setBalance("0");
      return;
    }

    const fetchBalance = async () => {
      try {
        setLoading(true);

        // Try to get balance using the account's coin balance API
        const balance = await aptosClient.getAccountAPTAmount({
          accountAddress: String(account.address),
        });

        setBalance((Number(balance) / 100000000).toFixed(4));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        // If account doesn't exist or no APT resource, set balance to 0 (this is normal for new accounts)
        if (
          message.includes("resource_not_found") ||
          message.includes("Account not found") ||
          message.includes("not found")
        ) {
          setBalance("0");
        } else {
          // Only log unexpected errors
          console.error("Failed to fetch balance:", error);
          setBalance("Error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [account?.address]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">TinyPay</h1>
          <WalletButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {connected && account ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Wallet Connected</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <span className="font-medium">Address:</span>{" "}
                  <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                    {String(account.address)}
                  </code>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Network:</span>{" "}
                  <span className="text-blue-600">{network?.name || "Unknown"}</span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Balance:</span>{" "}
                  <span className="font-semibold text-green-600">
                    {loading ? "Loading..." : `${balance} APT`}
                  </span>
                </p>
              </div>
            </div>

            {balance === "0" && !loading && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="mb-2 text-sm font-medium text-yellow-800">💡 Need testnet tokens?</p>
                <p className="mb-3 text-sm text-yellow-700">
                  Your account has no APT. Get free testnet tokens from the official faucet:
                </p>
                <a
                  href="https://faucet.aptoslabs.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-600"
                >
                  Get Testnet APT
                </a>
                <div className="mt-3 space-y-1 text-xs text-yellow-600">
                  <p>📝 Steps:</p>
                  <p>1. Sign in with your Google account</p>
                  <p>2. Copy your wallet address above (0x...)</p>
                  <p>3. Paste it in the faucet and click &ldquo;Request APT&rdquo;</p>
                  <p>4. Tokens will arrive in a few seconds</p>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                ✅ Wallet connected, you can start using TinyPay
              </p>
            </div>

            {/* Deposit form */}
            <DepositForm />
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 text-center shadow">
            <h2 className="mb-4 text-xl font-semibold">Connect Your Wallet</h2>
            <p className="mb-4 text-gray-600">
              Click the button above to connect your Aptos wallet
            </p>
            <div className="text-sm text-gray-500">
              💡 Need a wallet?{" "}
              <a
                href="https://petra.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Install Petra Wallet
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
