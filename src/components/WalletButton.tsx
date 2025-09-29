"use client";

import {
  useWallet,
  WalletReadyState,
} from "@aptos-labs/wallet-adapter-react";

export function WalletButton() {
  const { wallets, connected, disconnect, account, connect } = useWallet();

  // Connected state
  if (connected && account) {
    const address = String(account.address);
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Loading state
  if (!wallets || wallets.length === 0) {
    return (
      <button
        className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
        disabled
      >
        Loading...
      </button>
    );
  }

  // Get first available wallet
  const wallet = wallets[0];
  const isWalletReady = wallet.readyState === WalletReadyState.Installed;

  const onWalletConnectRequest = async () => {
    try {
      await connect(wallet.name);
    } catch (error) {
      console.warn("Wallet connection error:", error);
      window.alert("Failed to connect wallet. Please make sure Petra Wallet is installed.");
    }
  };

  // Desktop
  return (
    <button
      className={`px-4 py-2 rounded-lg transition ${
        isWalletReady
          ? "bg-blue-500 text-white hover:bg-blue-600"
          : "bg-gray-400 text-white cursor-not-allowed"
      }`}
      disabled={!isWalletReady}
      onClick={onWalletConnectRequest}
    >
      {isWalletReady ? "Connect Wallet" : "Install Petra Wallet"}
    </button>
  );
}
