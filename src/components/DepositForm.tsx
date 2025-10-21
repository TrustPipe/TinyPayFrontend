"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { completePaymentWorkflow, saveHashChain } from "@/utils/hashChain";
import { depositSOL } from "@/utils/solanaHelpers";

// 动态导入钱包按钮，禁用 SSR
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

/**
 * TinyPay Deposit Form Component (Solana Network)
 * Features:
 * 1. User inputs amount
 * 2. User inputs password
 * 3. SHA256 hash computation 1000 times
 * 4. Convert to bytecode (64 bytes)
 * 5. Call deposit interface on Solana
 */
export function DepositForm() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastHashResult, setLastHashResult] = useState("");
  const [status, setStatus] = useState("");

  const handleDeposit = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      setStatus("❌ Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus("❌ Please enter a valid amount");
      return;
    }

    if (!password || password.length < 6) {
      setStatus("❌ Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setStatus("⏳ Generating hash chain...");

      // Step 1 & 2: Generate seed (only password)
      const userSeed = password;

      // Step 3: SHA256 hash computation 1000 times
      console.log("🔐 Starting SHA256 hash computation (1000 iterations)...");
      const workflow = await completePaymentWorkflow(userSeed, 1000);

      // Display final hash result on screen
      setLastHashResult(workflow.tailHex);
      console.log("✅ Hash computation completed");

      if (!workflow.verificationOk) {
        setStatus("❌ Hash chain verification failed!");
        setLoading(false);
        return;
      }

      // Step 4: Get tail ASCII bytes (hex 字符串的 ASCII 表示，64 字节)
      const tailBytes = workflow.tailAsciiBytes;
      console.log("✅ Tail ASCII bytes ready, length:", tailBytes.length);

      // Step 5: Create Anchor provider
      setStatus("⏳ Preparing transaction...");
      const provider = new AnchorProvider(
        connection,
        { publicKey, signTransaction, signAllTransactions },
        { commitment: 'confirmed' }
      );

      // Step 6: Call deposit on Solana
      setStatus("⏳ Please confirm transaction in wallet...");
      const txSignature = await depositSOL(
        provider,
        parseFloat(amount),
        tailBytes
      );

      console.log("✅ Transaction submitted:", txSignature);

      // Save hash chain to local storage
      saveHashChain(publicKey.toString(), workflow.hashes);

      setStatus(`✅ Deposit successful! Signature: ${txSignature}`);

      // Clear form
      setAmount("");
      setPassword("");
      
    } catch (error) {
      console.error("❌ Deposit failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`❌ Failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">💰 Quick Deposit (SOL)</h2>

      {/* Wallet Connect Button */}
      <div>
        <WalletMultiButton className="!bg-gradient-to-br !from-[#91C8CA] !to-[#9FE0D1] !rounded-full !shadow-lg !shadow-[#91C8CA]/30 hover:!shadow-xl hover:!shadow-[#91C8CA]/40 !transition-all !w-full" />
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">
          Amount (SOL)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 0.1"
          className="w-full px-4 py-2.5 border border-[#91C8CA]/30 rounded-xl focus:ring-2 focus:ring-[#91C8CA]/50 focus:border-[#91C8CA]/50 bg-white/80 backdrop-blur-sm text-slate-900 text-sm placeholder:text-slate-400"
          disabled={loading}
          min="0"
          step="0.000000001"
        />
        <p className="text-xs text-slate-500 mt-1">
          1 SOL = 10^9 lamports (9 decimals)
        </p>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">
          Password (min 6 characters)
        </label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full px-4 py-2.5 border border-[#91C8CA]/30 rounded-xl focus:ring-2 focus:ring-[#91C8CA]/50 focus:border-[#91C8CA]/50 bg-white/80 backdrop-blur-sm text-slate-900 text-sm placeholder:text-slate-400"
          disabled={loading}
          minLength={6}
        />
        <p className="text-xs text-slate-500 mt-1">
          Used to generate unique payment hash chain
        </p>
      </div>

      {/* Hash Result Display */}
      {lastHashResult && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-3">
          <p className="text-xs font-medium text-green-700 mb-1.5">
            🔐 Hash Result (1000 iterations)
          </p>
          <code className="block text-[10px] text-green-600 break-all bg-white/70 p-2 rounded-lg font-mono">
            {lastHashResult}
          </code>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleDeposit}
        disabled={loading || !publicKey}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition shadow-lg ${
          loading || !publicKey
            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
            : "bg-gradient-to-br from-[#91C8CA] via-[#9FE0D1] to-[#D3A86C] text-white hover:shadow-xl hover:shadow-[#91C8CA]/40 hover:-translate-y-0.5 shadow-[#91C8CA]/30"
        }`}
      >
        {loading ? "⏳ Processing..." : "💰 Deposit Now"}
      </button>

      {/* Status Display */}
      {status && (
        <div className={`p-3 rounded-xl ${
          status.startsWith("✅") 
            ? "bg-green-50 border border-green-200/50 text-green-700"
            : status.startsWith("❌")
            ? "bg-red-50 border border-red-200/50 text-red-700"
            : "bg-blue-50 border border-blue-200/50 text-blue-700"
        }`}>
          <p className="text-xs whitespace-pre-wrap break-all">{status}</p>
        </div>
      )}
    </div>
  );
}
