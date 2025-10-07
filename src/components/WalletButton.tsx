"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { u2uNetwork } from "@/config/u2u";

/**
 * Wallet connection button component with dropdown menu
 */
export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({
    address,
    chainId: u2uNetwork.id,
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setIsOpen(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
  };

  if (!isConnected || !address) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            onClick={openConnectModal}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F2B92C]/25 via-[#F2B92C]/20 to-[#6B9EF5]/20 backdrop-blur-xl border border-[#F2B92C]/40 px-4 py-2 text-xs font-semibold text-slate-800 shadow-md shadow-[#F2B92C]/20 hover:shadow-lg hover:shadow-[#F2B92C]/30 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Connect Wallet
          </button>
        )}
      </ConnectButton.Custom>
    );
  }

  const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const balance = balanceData ? parseFloat(balanceData.formatted).toFixed(4) : '0.0000';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F2B92C]/25 via-[#F2B92C]/20 to-[#6B9EF5]/20 backdrop-blur-xl border border-[#F2B92C]/40 px-4 py-2 text-xs font-semibold text-slate-800 shadow-md shadow-[#F2B92C]/20 hover:shadow-lg hover:shadow-[#F2B92C]/30 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#91C8CA] to-[#9FE0D1]" />
          <span className="hidden sm:inline">{displayAddress}</span>
          <span className="sm:hidden">{address.slice(0, 6)}...</span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200/60 overflow-hidden z-50">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#91C8CA]/10 to-[#9FE0D1]/10 p-4 border-b border-slate-200/60">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#91C8CA] to-[#9FE0D1]" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium">U2U Network</p>
                <p className="text-sm font-semibold text-slate-800">{displayAddress}</p>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-xs text-slate-500 mb-0.5">Balance</p>
              <p className="text-lg font-bold text-slate-800">{balance} <span className="text-sm font-normal">U2U</span></p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={copyAddress}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Address
            </button>
            
            <a
              href={`https://u2uscan.xyz/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Explorer
            </a>

            <div className="border-t border-slate-200/60 my-2" />

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
