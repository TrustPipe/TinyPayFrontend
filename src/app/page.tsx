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

export default function Home() {
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
      } catch (error: any) {
        // If account doesn't exist or no APT resource, set balance to 0 (this is normal for new accounts)
        if (error?.message?.includes("resource_not_found") || 
            error?.message?.includes("Account not found") ||
            error?.message?.includes("not found")) {
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">TinyPay</h1>
          <WalletButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {connected && account ? (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Wallet Connected</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <span className="font-medium">Address:</span>{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {String(account.address)}
                  </code>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Network:</span>{" "}
                  <span className="text-blue-600">{network?.name || "Unknown"}</span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Balance:</span>{" "}
                  <span className="text-green-600 font-semibold">
                    {loading ? "Loading..." : `${balance} APT`}
                  </span>
                </p>
              </div>
            </div>

            {balance === "0" && !loading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  💡 Need testnet tokens?
                </p>
                <p className="text-sm text-yellow-700 mb-3">
                  Your account has no APT. Get free testnet tokens from the official faucet:
                </p>
                <a
                  href="https://faucet.aptoslabs.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm font-medium"
                >
                  Get Testnet APT
                </a>
                <div className="text-xs text-yellow-600 mt-3 space-y-1">
                  <p>📝 Steps:</p>
                  <p>1. Sign in with your Google account</p>
                  <p>2. Copy your wallet address above (0x...)</p>
                  <p>3. Paste it in the faucet and click "Request APT"</p>
                  <p>4. Tokens will arrive in a few seconds</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                ✅ Wallet connected, you can start using TinyPay
              </p>
            </div>

            {/* Deposit 表单 */}
            <DepositForm />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-4">
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
