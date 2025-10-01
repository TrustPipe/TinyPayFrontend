import Image from "next/image";
import Link from "next/link";

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

const architectureLayers = [
  {
    title: "Payer App",
    detail: "Generates OTP hash chains, manages deposits, works fully offline.",
  },
  {
    title: "Merchant App",
    detail: "Captures OTPs, queues payments, pushes transactions once reconnected.",
  },
  {
    title: "TinyPay Server",
    detail: "Verifies merchants, orchestrates contract calls, keeps wallets in sync.",
  },
  {
    title: "Aptos Smart Contract",
    detail: "Holds escrow, validates OTPs, releases funds trustlessly.",
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

export default function Home() {
  return (
    <div className="bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#f5f7fb]/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-[18px] border border-white/60 bg-white shadow-lg shadow-[#6B9EF5]/20">
              <Image src="/images/logo2.jpg" alt="TinyPay logo" fill className="object-cover" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TinyPay</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/deposit"
              className="rounded-full border border-[#6B9EF5] px-5 py-2 text-sm font-semibold text-[#6B9EF5] transition hover:bg-[#6B9EF5]/10"
            >
              Launch App
            </Link>
            <a
              href="https://testflight.apple.com/join"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#6B9EF5] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#6B9EF5]/40 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#6B9EF5]/50"
            >
              Download Apps
            </a>
            <a
              href="https://x.com/tinypay"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#6B9EF5] px-5 py-2 text-sm font-semibold text-[#6B9EF5] transition hover:bg-[#6B9EF5]/10"
            >
              Follow on X
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="relative flex min-h-screen flex-col justify-center py-16">
          <div className="absolute inset-0 -z-10 rounded-[60px] bg-gradient-to-br from-[#6B9EF5]/20 via-white to-[#F2B92C]/10 blur-3xl" aria-hidden />
          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-[#6B9EF5] shadow-sm shadow-[#6B9EF5]/20">
                <span className="h-2 w-2 rounded-full bg-[#6B9EF5]" /> Offline-first crypto payments
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
                Pay anywhere. Settle on Aptos when you are back online.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                TinyPay blends on-chain security with a cash-like offline experience. Generate single-use payment codes that merchants trust instantly—and the blockchain settles the rest.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://tinyurl.com/tinypay-demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#6B9EF5] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6B9EF5]/40 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#6B9EF5]/50"
                >
                  Watch the Demo
                </a>
                <a
                  href="https://github.com/TrustPipe/TinyPay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[#6B9EF5] px-6 py-3 text-sm font-semibold text-[#6B9EF5] transition hover:bg-[#6B9EF5]/10"
                >
                  Explore the Code
                </a>
              </div>
              <dl className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-[28px] bg-white/90 p-5 shadow-md shadow-[#6B9EF5]/10">
                  <dt className="text-sm text-slate-500">Time to transact</dt>
                  <dd className="text-2xl font-semibold text-slate-900">&lt; 5 seconds</dd>
                </div>
                <div className="rounded-[28px] bg-white/90 p-5 shadow-md shadow-[#6B9EF5]/10">
                  <dt className="text-sm text-slate-500">Supported assets</dt>
                  <dd className="text-2xl font-semibold text-slate-900">APT · USDC · FA</dd>
                </div>
                <div className="rounded-[28px] bg-white/90 p-5 shadow-md shadow-[#6B9EF5]/10">
                  <dt className="text-sm text-slate-500">Connectivity needed</dt>
                  <dd className="text-2xl font-semibold text-slate-900">Only to settle</dd>
                </div>
              </dl>
            </div>
            <div className="flex items-center">
              <div className="relative w-full rounded-[44px] bg-white p-8 shadow-[0_40px_120px_-40px_rgba(107,158,245,0.75)]">
                <div className="absolute inset-x-6 -top-10 rounded-[32px] border border-white/60 bg-[#6B9EF5] p-5 text-white shadow-lg shadow-[#6B9EF5]/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Merchant Sync</span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs">Live</span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold">OTP • 9X3F · 42.50 USDC</p>
                  <p className="mt-2 text-sm text-white/80">Queued. Auto-settles when network returns.</p>
                </div>
                <div className="mt-16 space-y-6">
                  <div className="rounded-[26px] border border-slate-200/80 p-6 shadow-inner shadow-[#6B9EF5]/10">
                    <h3 className="text-xl font-semibold text-slate-900">Aptos Trust Anchored</h3>
                    <p className="mt-3 text-sm text-slate-600">
                      Every OTP settles against a Move smart contract that protects balances, validates signatures, and releases funds without custody risk.
                    </p>
                  </div>
                  <div className="rounded-[26px] border border-slate-200/80 p-6 shadow-inner shadow-[#6B9EF5]/10">
                    <h3 className="text-xl font-semibold text-slate-900">Designed for speed</h3>
                    <p className="mt-3 text-sm text-slate-600">
                      Swipe-first mobile flows, passkey security, and instant receipts keep both shoppers and merchants moving.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen flex-col justify-center py-16">
          <div className="rounded-[48px] bg-white/80 p-10 shadow-[0_40px_120px_-60px_rgba(107,158,245,0.5)]">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6B9EF5]">User Journey</p>
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
                  className="rounded-[32px] border border-slate-100 bg-slate-50/80 p-8 transition hover:-translate-y-1 hover:border-[#6B9EF5]/50 hover:shadow-lg hover:shadow-[#6B9EF5]/20"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {features.map(feature => (
          <section key={feature.id} className="flex min-h-screen flex-col justify-center py-16">
            <div className="grid gap-10 rounded-[48px] bg-gradient-to-br from-white to-[#6B9EF5]/10 p-10 shadow-[0_40px_120px_-60px_rgba(107,158,245,0.4)] lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-6">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6B9EF5]">
                  {feature.label}
                </span>
                <h2 className="text-4xl font-semibold text-slate-900">{feature.headline}</h2>
                <p className="max-w-xl text-base leading-relaxed text-slate-600">{feature.copy}</p>
              </div>
              <div className="space-y-4">
                {feature.bulletPoints.map(point => (
                  <div
                    key={point}
                    className="flex items-start gap-4 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-inner shadow-[#6B9EF5]/10"
                  >
                    <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F2B92C]/30 text-sm font-semibold text-[#6B9EF5]">
                      •
                    </span>
                    <p className="text-sm text-slate-600">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="flex min-h-screen flex-col justify-center py-16">
          <div className="rounded-[48px] bg-white/90 p-10 shadow-[0_40px_120px_-60px_rgba(107,158,245,0.4)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6B9EF5]">Technical Architecture</p>
                <h2 className="mt-3 text-4xl font-semibold text-slate-900">Secure layers working together</h2>
              </div>
              <p className="max-w-xl text-base text-slate-600">
                A simple four-layer stack keeps offline payments trustworthy while ensuring merchants get paid fast the moment a connection comes back.
              </p>
            </div>
            <div className="relative mt-12 overflow-hidden rounded-[40px] border border-slate-100 bg-gradient-to-r from-[#6B9EF5]/15 via-white to-[#F2B92C]/15 p-10">
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/60" aria-hidden />
              <div className="grid gap-8 md:grid-cols-2">
                {architectureLayers.map(layer => (
                  <div key={layer.title} className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-md shadow-[#6B9EF5]/10">
                    <h3 className="text-xl font-semibold text-slate-900">{layer.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{layer.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-12 rounded-[30px] border border-dashed border-[#6B9EF5]/50 bg-white/70 p-6 text-center text-sm text-slate-600">
                Move smart contract (`tinypay.move`) validates OTP hash equality, updates the tail, and releases funds to the merchant wallet in a single atomic call.
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen flex-col justify-center py-16">
          <div className="rounded-[48px] bg-white/85 p-10 shadow-[0_40px_120px_-60px_rgba(107,158,245,0.4)]">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6B9EF5]">FAQ</p>
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
                  className="group rounded-[32px] border border-slate-100 bg-slate-50/80 p-6 transition hover:border-[#6B9EF5]/60 hover:shadow-lg hover:shadow-[#6B9EF5]/10"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-slate-900">
                    {item.question}
                    <span className="text-sm font-normal text-[#6B9EF5] transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 text-sm text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen flex-col justify-center py-16">
          <div className="rounded-[48px] bg-gradient-to-br from-[#6B9EF5] via-[#6B9EF5] to-[#F2B92C] p-[1px] shadow-[0_40px_120px_-60px_rgba(107,158,245,0.6)]">
            <div className="rounded-[46px] bg-white/95 p-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6B9EF5]">Ready to deploy</p>
              <h2 className="mt-6 text-4xl font-semibold text-slate-900">Bring offline crypto payments to your checkout</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
                Pilot TinyPay with your team and delight customers who want the speed of contactless with the flexibility of crypto. We will help you integrate in under a week.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <a
                  href="mailto:team@tinypay.xyz"
                  className="rounded-full bg-[#6B9EF5] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6B9EF5]/40 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#6B9EF5]/50"
                >
                  Start a Pilot
                </a>
                <a
                  href="https://cal.com/tinypay/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[#6B9EF5] px-7 py-3 text-sm font-semibold text-[#6B9EF5] transition hover:bg-[#6B9EF5]/10"
                >
                  Book a Call
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/60 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} TinyPay. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="/terms" className="hover:text-[#6B9EF5]">Terms</a>
            <a href="/privacy" className="hover:text-[#6B9EF5]">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
