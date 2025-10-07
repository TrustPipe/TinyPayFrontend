"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { completePaymentWorkflow, saveHashChain } from "@/utils/hashChain";
import { completeDepositFlow } from "@/utils/contractHelpers";
import { SUPPORTED_TOKENS } from "@/config/u2u";

/**
 * TinyPay Deposit Form Component (U2U Network)
 * Features:
 * 1. User inputs amount
 * 2. User inputs password
 * 3. SHA256 hash computation 1000 times
 * 4. Convert to bytecode (32 bytes raw hash)
 * 5. Call deposit interface (with auto-approve for ERC20)
 */
export function DepositForm() {
  const { address: account, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [asset, setAsset] = useState<"U2U" | "USDC" | "USDT">("U2U");
  const [loading, setLoading] = useState(false);
  const [lastHashResult, setLastHashResult] = useState("");
  const [status, setStatus] = useState("");

  const handleDeposit = async () => {
    if (!isConnected || !account) {
      setStatus("❌ Please connect your wallet first");
      return;
    }

    if (!publicClient || !walletClient) {
      setStatus("❌ Wallet client not ready");
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

      // Step 4: Get tail hex string (for UTF-8 encoding)
      const tailHexString = workflow.tailHex;
      console.log("✅ Tail hex string ready:", tailHexString);

      // Step 5: Call deposit interface (with auto-approve for ERC20)
      setStatus("⏳ Preparing contract call...");
      
      const tokenConfig = SUPPORTED_TOKENS[asset];
      console.log("📝 Building transaction parameters:");
      console.log("  - Asset:", asset);
      console.log("  - Token address:", tokenConfig.address);
      console.log("  - Amount:", amount, asset);
      console.log("  - Tail hex string:", tailHexString);
      console.log("  - Is native:", tokenConfig.isNative);
      
      // Complete deposit flow (with auto-approve)
      const txHash = await completeDepositFlow(
        publicClient,
        walletClient,
        asset,
        parseFloat(amount),
        tailHexString,
        (progressStatus) => {
          setStatus(progressStatus);
        }
      );
      
      console.log("✅ Transaction submitted:", txHash);
      
      // Save hash chain to local storage
      saveHashChain(account, workflow.hashes);
      
      setStatus(`✅ Deposit successful! Tx hash: ${txHash}`);
      
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

  // 获取资产的输入步长和示例
  const getAssetInputConfig = () => {
    const token = SUPPORTED_TOKENS[asset];
    if (token.isNative) {
      return {
        step: "0.000000000000000001", // 18 decimals
        example: "0.1",
        hint: `1 U2U = 10^18 wei (18 位小数)`
      };
    } else {
      return {
        step: "0.000001", // 6 decimals
        example: "10.5",
        hint: `${asset} 使用 6 位小数`
      };
    }
  };

  const inputConfig = getAssetInputConfig();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">💰 Quick Deposit</h2>
      
      {/* Asset Selection */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">
          Select Asset
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setAsset("U2U")}
            disabled={loading}
            className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition ${
              asset === "U2U"
                ? "bg-gradient-to-br from-[#91C8CA] to-[#9FE0D1] text-white shadow-md"
                : "bg-white/60 text-slate-700 hover:bg-white/80 border border-[#91C8CA]/20"
            }`}
          >
            💎 U2U
          </button>
          <button
            onClick={() => setAsset("USDC")}
            disabled={loading}
            className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition ${
              asset === "USDC"
                ? "bg-gradient-to-br from-[#91C8CA] to-[#9FE0D1] text-white shadow-md"
                : "bg-white/60 text-slate-700 hover:bg-white/80 border border-[#91C8CA]/20"
            }`}
          >
            💵 USDC
          </button>
          <button
            onClick={() => setAsset("USDT")}
            disabled={loading}
            className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition ${
              asset === "USDT"
                ? "bg-gradient-to-br from-[#91C8CA] to-[#9FE0D1] text-white shadow-md"
                : "bg-white/60 text-slate-700 hover:bg-white/80 border border-[#91C8CA]/20"
            }`}
          >
            💰 USDT
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">
          Amount ({asset})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`e.g. ${inputConfig.example}`}
          className="w-full px-4 py-2.5 border border-[#91C8CA]/30 rounded-xl focus:ring-2 focus:ring-[#91C8CA]/50 focus:border-[#91C8CA]/50 bg-white/80 backdrop-blur-sm text-slate-900 text-sm placeholder:text-slate-400"
          disabled={loading}
          min="0"
          step={inputConfig.step}
        />
        <p className="text-xs text-slate-500 mt-1">
          {inputConfig.hint}
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
        disabled={loading || !isConnected}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition shadow-lg ${
          loading || !isConnected
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
