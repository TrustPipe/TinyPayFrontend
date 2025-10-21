"use client";

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState, useRef } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Custom wallet connection button component
 * Circular icon-only design with dropdown menu
 */
export function WalletButton() {
  const { connected, disconnect, publicKey } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch balance when connected
  useEffect(() => {
    if (publicKey && connection && connected) {
      connection.getBalance(publicKey).then(bal => {
        setBalance(bal / LAMPORTS_PER_SOL);
      }).catch(err => {
        console.error('Failed to get balance:', err);
      });
    }
  }, [publicKey, connection, connected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleClick = () => {
    if (connected) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      setVisible(true);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setIsDropdownOpen(false);
    }
  };

  if (!mounted) {
    return (
      <button
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#F2B92C]/25 via-[#F2B92C]/20 to-[#6B9EF5]/20 backdrop-blur-xl border border-[#F2B92C]/40 text-slate-800 shadow-md shadow-[#F2B92C]/20 transition-all"
        disabled
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleClick}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#F2B92C]/25 via-[#F2B92C]/20 to-[#6B9EF5]/20 backdrop-blur-xl border border-[#F2B92C]/40 text-slate-800 shadow-md shadow-[#F2B92C]/20 hover:shadow-lg hover:shadow-[#F2B92C]/30 transition-all"
        aria-label={connected ? `Connected: ${publicKey?.toString().slice(0, 4)}...${publicKey?.toString().slice(-4)}` : "Connect Wallet"}
      >
        {/* Wallet Icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>

        {/* Connected indicator */}
        {connected && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-white"></span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {connected && isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#F2B92C]/30 bg-white/95 backdrop-blur-xl shadow-xl shadow-[#F2B92C]/20 overflow-hidden z-50">
          <div className="p-4 border-b border-slate-200/60">
            <p className="text-xs text-slate-600 mb-1">Wallet Address</p>
            <p className="text-sm font-mono font-semibold text-slate-800">
              {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-6)}
            </p>
            <p className="text-xs text-slate-600 mt-2">Balance</p>
            <p className="text-lg font-bold text-slate-900">
              {balance.toFixed(4)} <span className="text-sm text-slate-600">SOL</span>
            </p>
          </div>
          <div className="p-2">
            <button
              onClick={copyAddress}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Address
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
