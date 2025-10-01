"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { completePaymentWorkflow, saveHashChain } from "@/utils/hashChain";
import { CONTRACT_ADDRESS, ASSETS, amountToContractUnits, getAssetMetadata, getAPTMetadata } from "@/utils/contract";

/**
 * TinyPay Deposit Form Component
 * Features:
 * 1. User inputs amount
 * 2. User inputs password
 * 3. SHA256 hash computation 1000 times
 * 4. Convert to bytecode
 * 5. Call deposit interface
 */
export function DepositForm() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [asset, setAsset] = useState<"APT" | "USDC">("APT");
  const [loading, setLoading] = useState(false);
  const [lastHashResult, setLastHashResult] = useState("");
  const [status, setStatus] = useState("");

  const handleDeposit = async () => {
    if (!account) {
      setStatus("❌ Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus("❌ Please enter a valid amount");
      return;
    }

    if (!password || password.length < 6) {
      setStatus("❌ Please enter a password with at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setStatus("⏳ Generating hash chain...");

      // Step 1 & 2: Generate seed (only password, same as Python script)
      // Note: Same password will generate the same hash result
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

      // Step 4: Get bytecode (use ASCII bytes for contract)
      // Contract expects ASCII representation of hex string, not raw bytes
      const tailBytes = workflow.tailAsciiBytes;
      console.log("✅ Bytecode ready (ASCII bytes):", tailBytes.length, "bytes");

      // Step 5: Call deposit interface
      setStatus("⏳ Calling contract...");
      
      // Get asset metadata address
      const assetMetadata = getAssetMetadata(asset);
      const contractAmount = amountToContractUnits(parseFloat(amount), asset);
      
      console.log("📝 Building transaction with arguments:");
      console.log("  - Asset:", asset);
      console.log("  - Function:", `${CONTRACT_ADDRESS}::tinypay::deposit`);
      console.log("  - Signer (auto):", account.address);
      console.log("  - arg0 (Object<Metadata>):", assetMetadata);
      console.log("  - arg1 (u64):", contractAmount);
      console.log("  - arg2 (vector<u8>):", Array.from(tailBytes));
      console.log("  - arg2 length:", tailBytes.length);
      
      setStatus("⏳ Building transaction...");
      
      // Use wallet adapter's signAndSubmitTransaction with new API format
      // deposit(&signer, token_metadata, amount, tail_bytes)
      // signer is automatically passed (connected wallet)
      const transaction = {
        data: {
          function: `${CONTRACT_ADDRESS}::tinypay::deposit`,
          functionArguments: [
            assetMetadata,        // arg0: Object<Metadata> (0xA for APT)
            contractAmount,       // arg1: u64 (amount)
            Array.from(tailBytes) // arg2: vector<u8> (tail bytes)
          ]
        }
      } as any;

      console.log("📝 Transaction built successfully, awaiting signature...");
      const response = await signAndSubmitTransaction(transaction);
      
      console.log("✅ Transaction submitted:", response);
      
      // Extract transaction hash from response
      const txHash = (response as any)?.hash || JSON.stringify(response).slice(0, 50);
      
      // Save hash chain to local storage
      saveHashChain(String(account.address), workflow.hashes);
      
      setStatus(`✅ Deposit successful! Transaction hash: ${txHash}`);
      
      // Clear form
      setAmount("");
      setPassword("");
      
    } catch (error: any) {
      console.error("❌ Deposit failed:", error);
      setStatus(`❌ Failed: ${error.message || String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">💰 Deposit to TinyPay</h2>
      
      {/* Asset Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Asset
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setAsset("APT")}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
              asset === "APT"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            🪙 APT
          </button>
          <button
            onClick={() => setAsset("USDC")}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
              asset === "USDC"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            💵 USDC
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount ({asset})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter amount, e.g. ${asset === "APT" ? "1" : "10.5"}`}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          disabled={loading}
          min="0"
          step={asset === "APT" ? "0.00000001" : "0.01"}
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 {asset === "APT" ? "1 APT = 100,000,000 octas (8 decimals)" : "Test USDC with 8 decimals"}
        </p>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password (at least 6 characters)
        </label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          disabled={loading}
          minLength={6}
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 This password will be used to generate a unique payment hash chain
        </p>
      </div>

      {/* Hash Result Display */}
      {lastHashResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800 mb-2">
            🔐 SHA256 Hash Result (after 1000 iterations):
          </p>
          <code className="block text-xs text-green-700 break-all bg-white p-2 rounded">
            {lastHashResult}
          </code>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleDeposit}
        disabled={loading || !account}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
          loading || !account
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
        }`}
      >
        {loading ? "⏳ Processing..." : "Deposit"}
      </button>

      {/* Status Display */}
      {status && (
        <div className={`p-4 rounded-lg ${
          status.startsWith("✅") 
            ? "bg-green-50 border border-green-200 text-green-800"
            : status.startsWith("❌")
            ? "bg-red-50 border border-red-200 text-red-800"
            : "bg-blue-50 border border-blue-200 text-blue-800"
        }`}>
          <p className="text-sm whitespace-pre-wrap break-all">{status}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-600 space-y-1">
          <span className="block font-semibold mb-2">📋 Process Flow:</span>
          <span className="block">1️⃣ Enter deposit amount</span>
          <span className="block">2️⃣ Enter password (for hash chain generation)</span>
          <span className="block">3️⃣ System performs SHA256 hash computation 1000 times</span>
          <span className="block">4️⃣ Convert to bytecode (background processing)</span>
          <span className="block">5️⃣ Call deposit contract to complete deposit</span>
        </p>
      </div>
    </div>
  );
}
