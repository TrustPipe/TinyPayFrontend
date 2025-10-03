"use client"

import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import VantaBackground from "@/components/VantaBackground";
import { aptosClient } from "@/utils/aptosClient";
import { completePaymentWorkflow, saveHashChain } from "@/utils/hashChain";
import { CONTRACT_ADDRESS, amountToContractUnits, getAssetMetadata } from "@/utils/contract";

const journey = [
  {
    title: "Discover TinyPay",
    description:
      "Try the offline-first crypto payment experience built for real-world merchants.",
  },
  {
    title: "Download & Activate",
    description:
      "Install the TinyPay payer and merchant apps, then fund your wallet in minutes.",
  },
  {
    title: "Pay with One-Time Codes",
    description:
      "Generate secure OTPs without connectivity and share them with the merchant instantly.",
  },
  {
    title: "Settle Trustlessly",
    description:
      "Transactions reconcile automatically on Aptos as soon as either party is back online.",
  },
];

const features = [
  {
    id: "feature-otp",
    label: "Offline Hash-Chains",
    headline: "Payments keep flowing even when the network does not.",
    copy:
      "TinyPay pairs a local hash-chain OTP engine with Aptos so every payment remains single-use, verifiable, and fraud-proof—no cell towers required.",
    bulletPoints: [
      "1000-iteration SHA-256 hash chain seeded locally",
      "Merchant verifies OTP, submits when back online",
      "Automatic chain advancement prevents replay"
    ],
  },
  {
    id: "feature-contract",
    label: "Non-Custodial Smart Contract",
    headline: "Funds stay in your control from deposit to settlement.",
    copy:
      "All balances live in a trust-minimized Aptos Move contract. Users deposit once and transact freely knowing every OTP routes funds exactly once.",
    bulletPoints: [
      "Supports APT, USDC, and any FA-compliant asset",
      "Runs Precommit & Paymaster flows side-by-side",
      "Open-source contract audited by the community"
    ],
  },
  {
    id: "feature-experience",
    label: "Dual iOS Apps",
    headline: "Designed for people, not protocols.",
    copy:
      "Two minimal iOS apps—TinyPay for payers and TinyPayCheckout for merchants—deliver a swipe-friendly experience with biometric security and instant OTP scanning.",
    bulletPoints: [
      "Face ID & passcode protection for every payment",
      "Realtime balance updates when connectivity returns",
      "Built-in tipping, notes, and transaction receipts"
    ],
  },
];


const faqs = [
  {
    question: "How does TinyPay work without internet?",
    answer:
      "Payees pre-load funds on-chain, then generate a rolling hash-chain of OTPs. Each OTP approves one payment, and the contract reconciles once either party reconnects.",
  },
  {
    question: "Which assets can I use?",
    answer:
      "APT, USDC, and any Aptos Fungible Asset are supported today. Additional tokens are just a metadata object away.",
  },
  {
    question: "Is the system non-custodial?",
    answer:
      "Yes. Funds never leave the smart contract you control. OTPs simply authorize release to a merchant.",
  },
  {
    question: "Do merchants need special hardware?",
    answer:
      "No. The TinyPayCheckout iOS app handles QR scanning, OTP entry, and syncing. Dedicated POS hardware is on our roadmap.",
  },
];

const SECTION_HEIGHT = "flex min-h-[calc(100vh-84px)] flex-col justify-center py-16";
const LAST_SECTION_HEIGHT = "flex min-h-[calc(100vh-84px-8rem)] flex-col justify-center py-16";

export default function Home() {
  const { connected, account, network, connect, disconnect, wallets, signAndSubmitTransaction } = useWallet();
  const [balance, setBalance] = useState<string>("0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [asset, setAsset] = useState<"APT" | "USDC">("APT");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositStatus, setDepositStatus] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // Monitor scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch balance when wallet is connected
  useEffect(() => {
    if (!account?.address) {
      setBalance("0");
      return;
    }

    const fetchBalance = async () => {
      try {
        setLoadingBalance(true);
        const balance = await aptosClient.getAccountAPTAmount({
          accountAddress: String(account.address),
        });
        setBalance((Number(balance) / 100000000).toFixed(4));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (
          message.includes("resource_not_found") ||
          message.includes("Account not found") ||
          message.includes("not found")
        ) {
          setBalance("0");
        } else {
          console.error("Failed to fetch balance:", error);
          setBalance("Error");
        }
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [account?.address]);

  const handleDeposit = async () => {
    if (!account) {
      setDepositStatus("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setDepositStatus("Please enter a valid amount");
      return;
    }

    if (!password || password.length < 6) {
      setDepositStatus("Password must be at least 6 characters");
      return;
    }

    try {
      setDepositLoading(true);
      setDepositStatus("Generating hash chain...");

      const workflow = await completePaymentWorkflow(password, 1000);
      
      if (!workflow.verificationOk) {
        setDepositStatus("Hash chain verification failed!");
        setDepositLoading(false);
        return;
      }

      const tailBytes = workflow.tailAsciiBytes;
      setDepositStatus("Submitting transaction...");
      
      const assetMetadata = getAssetMetadata(asset);
      const contractAmount = amountToContractUnits(parseFloat(amount), asset);
      
      const response = await signAndSubmitTransaction({
        data: {
          function: `${CONTRACT_ADDRESS}::tinypay::deposit`,
          functionArguments: [
            assetMetadata,
            contractAmount,
            Array.from(tailBytes)
          ]
        }
      } as never);
      const txHash = typeof response === 'object' && response !== null && 'hash' in response 
        ? String(response.hash) 
        : "Success";
      
      saveHashChain(String(account.address), workflow.hashes);
      
      setDepositStatus(`Deposit successful! Hash: ${txHash.slice(0, 16)}...`);
      setAmount("");
      setPassword("");
      
    } catch (error) {
      console.error("Deposit failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setDepositStatus(`Failed: ${errorMessage}`);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleConnect = async () => {
    if (wallets && wallets.length > 0) {
      try {
        await connect(wallets[0].name);
      } catch (error) {
        console.error("Failed to connect:", error);
      }
    }
  };

  return (
    <div className="relative bg-[#f5f7fb] text-slate-900">
      <VantaBackground />
      <div className="absolute top-[100vh] left-0 right-0 bottom-0 bg-[#f5f7fb] z-[1]">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute top-0 left-0 w-[150vw] h-[100vh] bg-gradient-to-br from-[#6B9EF5]/15 via-transparent to-transparent blur-[120px]" />
          <div className="absolute top-[50vh] right-0 w-[150vw] h-[100vh] bg-gradient-to-bl from-[#F2B92C]/12 via-transparent to-transparent blur-[120px]" />
          <div className="absolute top-[100vh] left-0 w-[150vw] h-[100vh] bg-gradient-to-tr from-[#6B9EF5]/10 via-transparent to-[#F2B92C]/8 blur-[120px]" />
        </div>
      </div>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'backdrop-blur-md bg-white/30' : 'bg-transparent'
      }`}>
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-[18px] border border-white/60 bg-white shadow-lg shadow-[#6B9EF5]/20">
              <Image src="/images/logo2.jpg" alt="TinyPay logo" fill className="object-cover" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">
              Tiny<span className="italic">Pay</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://tinyurl.com/tinypay-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-[#91C8CA] px-5 py-2 text-sm font-semibold text-[#91C8CA] transition hover:bg-gradient-to-r hover:from-[#91C8CA] hover:via-[#9FE0D1] hover:to-[#D3A86C] hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-[#91C8CA]/40"
            >
              Watch the Demo
            </a>
            <a
              href="https://testflight.apple.com/join"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-[#91C8CA] p-2 text-[#91C8CA] transition hover:bg-gradient-to-br hover:from-[#91C8CA]/10 hover:to-[#9FE0D1]/10"
              aria-label="Download on App Store"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            </a>
            <a
              href="https://github.com/TrustPipe/TinyPay"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-[#91C8CA] p-2 text-[#91C8CA] transition hover:bg-gradient-to-br hover:from-[#91C8CA]/10 hover:to-[#9FE0D1]/10"
              aria-label="View on GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="https://x.com/tinypay"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-[#91C8CA] p-2 text-[#91C8CA] transition hover:bg-gradient-to-br hover:from-[#91C8CA]/10 hover:to-[#9FE0D1]/10"
              aria-label="Follow on X"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className={SECTION_HEIGHT}>
          <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F2B92C]/25 via-[#F2B92C]/20 to-[#6B9EF5]/20 backdrop-blur-xl border border-[#F2B92C]/50 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-lg shadow-[#F2B92C]/25 hover:shadow-xl hover:shadow-[#F2B92C]/35 transition-all">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F2B92C] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F2B92C]"></span>
                </span>
                Offline-first crypto payments
              </div>
              <h1 className="text-5xl font-semibold tracking-tight text-slate-900 md:text-7xl leading-relaxed md:leading-relaxed">
                <span className="text-6xl md:text-8xl italic tracking-widest bg-gradient-to-r from-[#D3A86C] via-[#91C8CA] via-[#9FE0D1] to-[#D3A86C] bg-clip-text text-transparent">Pay</span> anywhere. Settle on Aptos when <span className="bg-gradient-to-r from-[#D3A86C] via-[#91C8CA] via-[#9FE0D1] to-[#D3A86C] bg-clip-text text-transparent">back online</span>.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
                TinyPay blends on-chain security with a cash-like offline experience. Generate single-use payment codes that merchants trust instantly—and the blockchain settles the rest.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-lg space-y-6">
                {/* Card 1: Wallet Info */}
                <div className="rounded-[32px] border border-[#F2B92C]/30 bg-gradient-to-br from-[#F2B92C]/60 to-[#E8A91C]/70 backdrop-blur-xl p-6 text-white shadow-lg shadow-[#F2B92C]/40">
                  {connected && account ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold">Quick Deposit</span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                            {network?.name || "Unknown"}
                          </span>
                          <button
                            onClick={disconnect}
                            className="rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-medium transition"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs opacity-75">Balance</p>
                          <p className="text-3xl font-bold">
                            {loadingBalance ? "..." : balance} <span className="text-xl">APT</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs opacity-75">Address</p>
                          <p className="text-sm font-mono opacity-90">
                            {String(account.address).slice(0, 8)}...{String(account.address).slice(-6)}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center py-4">
                        <p className="text-xl font-semibold mb-3">Connect Wallet</p>
                        <p className="text-sm opacity-80 mb-4">Connect your Aptos wallet to start using TinyPay</p>
                        <button
                          onClick={handleConnect}
                          className="rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-sm px-6 py-2 text-sm font-semibold transition"
                        >
                          Connect Now
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Card 2: Deposit Form */}
                <div className="rounded-[28px] border border-[#91C8CA]/30 bg-gradient-to-br from-[#9FE0D1]/12 via-white/95 to-[#D3A86C]/8 backdrop-blur-xl p-6 shadow-xl shadow-[#91C8CA]/20">
                  <div className="flex gap-4">
                    {/* Left: Input Fields */}
                    <div className="flex-1 space-y-3">
                      {/* Amount Input with Asset Selector */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Amount
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`e.g. ${asset === "APT" ? "1.0" : "10.5"}`}
                            className="flex-1 px-4 py-2.5 border border-[#91C8CA]/30 rounded-xl focus:ring-2 focus:ring-[#91C8CA]/50 focus:border-[#91C8CA]/50 bg-white/80 backdrop-blur-sm text-slate-900 text-sm placeholder:text-slate-400"
                            disabled={depositLoading || !connected}
                            min="0"
                            step="0.01"
                          />
                          <select
                            value={asset}
                            onChange={(e) => setAsset(e.target.value as "APT" | "USDC")}
                            disabled={depositLoading || !connected}
                            className="px-3 py-2.5 border border-[#91C8CA]/30 rounded-xl focus:ring-2 focus:ring-[#91C8CA]/50 focus:border-[#91C8CA]/50 bg-white/80 backdrop-blur-sm text-slate-900 text-sm font-semibold cursor-pointer"
                          >
                            <option value="APT">APT</option>
                            <option value="USDC">USDC</option>
                          </select>
                        </div>
                      </div>

                      {/* Password Input */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Password (min. 6 chars)
                        </label>
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          className="w-full px-4 py-2.5 border border-[#91C8CA]/30 rounded-xl focus:ring-2 focus:ring-[#91C8CA]/50 focus:border-[#91C8CA]/50 bg-white/80 backdrop-blur-sm text-slate-900 text-sm placeholder:text-slate-400"
                          disabled={depositLoading || !connected}
                          minLength={6}
                        />
                      </div>
                    </div>

                    {/* Right: Submit Button */}
                    <div className="flex items-stretch">
                      <button
                        onClick={handleDeposit}
                        disabled={depositLoading || !connected}
                        className={`px-5 py-4 rounded-xl font-semibold text-sm transition whitespace-nowrap flex flex-col items-center justify-center gap-1 min-w-[100px] ${
                          depositLoading || !connected
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                            : "bg-gradient-to-br from-[#91C8CA] via-[#9FE0D1] to-[#D3A86C] text-white hover:shadow-xl hover:shadow-[#91C8CA]/40 hover:-translate-y-0.5 shadow-lg shadow-[#91C8CA]/30"
                        }`}
                      >
                        {depositLoading ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-xs">Processing</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="font-bold">Deposit</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 3: Status/Info */}
                <div className="rounded-[28px] border border-[#D3A86C]/25 bg-gradient-to-br from-white/90 via-[#9FE0D1]/8 to-white/85 backdrop-blur-xl p-6 shadow-xl shadow-[#D3A86C]/15">
                  {depositStatus ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          depositStatus.includes("successful") 
                            ? "bg-green-500" 
                            : depositStatus.includes("Failed") || depositStatus.includes("failed")
                            ? "bg-red-500"
                            : "bg-[#91C8CA] animate-pulse"
                        }`} />
                        <h3 className="text-sm font-semibold text-slate-900">Transaction Status</h3>
                      </div>
                      <p className={`text-sm font-medium ${
                        depositStatus.includes("successful") 
                          ? "text-green-600" 
                          : depositStatus.includes("Failed") || depositStatus.includes("failed")
                          ? "text-red-600"
                          : "text-[#91C8CA]"
                      }`}>
                        {depositStatus}
                      </p>
                      {depositStatus.includes("successful") && (
                        <Link
                          href="/deposit"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#91C8CA] hover:text-[#9FE0D1] transition mt-2"
                        >
                          View full details →
                        </Link>
                      )}
                  </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">Getting Started</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Deposit funds to start making offline payments. Your assets are secured by Aptos smart contracts.
                      </p>
                      <Link
                        href="/deposit"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#91C8CA] hover:text-[#9FE0D1] transition group"
                      >
                        Learn more about deposits 
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </Link>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={SECTION_HEIGHT}>
          <div className="rounded-[48px] bg-gradient-to-br from-white/90 via-[#9FE0D1]/8 to-white/80 p-10 shadow-[0_40px_120px_-60px_rgba(145,200,202,0.4)]">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#91C8CA]">User Journey</p>
                <h2 className="mt-3 text-4xl font-semibold text-slate-900">A cash-like flow for digital value</h2>
              </div>
              <p className="max-w-lg text-base text-slate-600">
                TinyPay removes the friction between blockchain rails and real-world payments. Here is what it feels like from onboarding to settlement.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {journey.map(step => (
                <div
                  key={step.title}
                  className="rounded-[32px] border border-[#9FE0D1]/20 bg-white/80 backdrop-blur-sm p-8 transition hover:-translate-y-1 hover:border-[#91C8CA]/50 hover:shadow-lg hover:shadow-[#91C8CA]/20"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {features.map(feature => (
          <section key={feature.id} className={SECTION_HEIGHT}>
            <div className="grid gap-10 rounded-[48px] bg-gradient-to-br from-[#D3A86C]/8 via-white/95 to-[#9FE0D1]/10 p-10 shadow-[0_40px_120px_-60px_rgba(211,168,108,0.3)] lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-6">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-[#91C8CA]/20 to-[#9FE0D1]/20 backdrop-blur-sm px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#91C8CA] border border-[#91C8CA]/25">
                  {feature.label}
                </span>
                <h2 className="text-4xl font-semibold text-slate-900">{feature.headline}</h2>
                <p className="max-w-xl text-base leading-relaxed text-slate-600">{feature.copy}</p>
              </div>
              <div className="space-y-4">
                {feature.bulletPoints.map(point => (
                  <div
                    key={point}
                    className="flex items-start gap-4 rounded-[28px] border border-[#9FE0D1]/30 bg-white/90 backdrop-blur-sm p-6 shadow-inner shadow-[#91C8CA]/8"
                  >
                    <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#D3A86C]/25 to-[#9FE0D1]/25 text-sm font-semibold text-[#91C8CA]">
                      •
                    </span>
                    <p className="text-sm text-slate-600">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className={SECTION_HEIGHT}>
          <div className="rounded-[48px] bg-gradient-to-r from-[#91C8CA]/12 via-white/95 to-[#D3A86C]/12 p-10 shadow-[0_40px_120px_-60px_rgba(145,200,202,0.35)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#91C8CA]">Technical Architecture</p>
                <h2 className="mt-3 text-4xl font-semibold text-slate-900">Secure layers working together</h2>
              </div>
              <p className="max-w-xl text-base text-slate-600">
                A simple four-layer stack keeps offline payments trustworthy while ensuring merchants get paid fast the moment a connection comes back.
              </p>
            </div>
            <div className="mt-12">
              <Image 
                src="/images/arc.png" 
                alt="TinyPay Architecture Diagram" 
                width={1200} 
                height={800}
                className="w-full h-auto rounded-[32px] shadow-lg shadow-[#91C8CA]/20"
              />
            </div>
          </div>
        </section>

        <section className={SECTION_HEIGHT}>
          <div className="rounded-[48px] bg-gradient-to-br from-white/90 via-[#9FE0D1]/5 to-white/85 p-10 shadow-[0_40px_120px_-60px_rgba(159,224,209,0.3)]">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#91C8CA]">FAQ</p>
                <h2 className="mt-3 text-4xl font-semibold text-slate-900">Answers before you ask</h2>
              </div>
              <p className="max-w-xl text-base text-slate-600">
                Reach out if you need deeper technical docs or want to explore pilots. We are quick on replies.
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map(item => (
                <details
                  key={item.question}
                  className="group rounded-[32px] border border-[#9FE0D1]/25 bg-white/80 backdrop-blur-sm p-6 transition hover:border-[#91C8CA]/50 hover:shadow-lg hover:shadow-[#91C8CA]/15"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-slate-900">
                    {item.question}
                    <span className="text-sm font-normal text-[#91C8CA] transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 text-sm text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={`relative ${LAST_SECTION_HEIGHT}`}>
          <div className="absolute left-1/2 -translate-x-1/2 w-screen top-0 bottom-0 -z-10 bg-gradient-to-br from-[#91C8CA]/25 via-[#9FE0D1]/15 to-[#D3A86C]/25 blur-3xl" />
          <div className="rounded-[48px] bg-gradient-to-br from-[#D3A86C] via-[#91C8CA] to-[#9FE0D1] p-[1px] shadow-[0_40px_120px_-60px_rgba(145,200,202,0.5)]">
            <div className="rounded-[46px] bg-white/95 p-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#91C8CA]">Ready to deploy</p>
              <h2 className="mt-6 text-4xl font-semibold text-slate-900">Bring offline crypto payments to your checkout</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
                Pilot TinyPay with your team and delight customers who want the speed of contactless with the flexibility of crypto. We will help you integrate in under a week.
              </p>
              <div className="mt-10 flex justify-center">
                <a
                  href="mailto:team@tinypay.xyz"
                  className="rounded-full bg-gradient-to-r from-[#91C8CA] via-[#9FE0D1] to-[#D3A86C] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#91C8CA]/40 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#91C8CA]/50"
                >
                  Start a Pilot
                </a>
              </div>
              <div className="mt-12 pt-12 border-t border-slate-200/60">
                <p className="text-sm font-medium text-slate-600 mb-4">Scan to Download TestFlight</p>
                <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-lg">
                  <Image 
                    src="/images/qrcode.png" 
                    alt="TestFlight QR Code" 
                    width={128} 
                    height={128}
                    className="w-32 h-32"
                  />
                </div>
                <p className="mt-3 text-xs text-slate-500">Available for iOS</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-16 py-8 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <span>© {new Date().getFullYear()} TinyPay</span>
          <span className="text-slate-300">·</span>
          <a href="/terms" className="hover:text-[#91C8CA] transition">Terms</a>
          <span className="text-slate-300">·</span>
          <a href="/privacy" className="hover:text-[#91C8CA] transition">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
