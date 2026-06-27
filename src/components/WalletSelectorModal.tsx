import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wallet, Shield, Check, Info } from "lucide-react";
import { WalletOption, WalletType } from "../types";

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: "freighter",
    name: "Freighter Wallet",
    icon: "🚀",
    description: "The official browser extension wallet developed by the Stellar Development Foundation.",
    downloadUrl: "https://www.freighter.app/",
  },
  {
    id: "albedo",
    name: "Albedo Wallet",
    icon: "🌌",
    description: "A fast, browser-centric web wallet and signer. Excellent for quick transactions.",
    downloadUrl: "https://albedo.link/",
  },
  {
    id: "lobstr",
    name: "Lobstr Wallet",
    icon: "🦞",
    description: "A popular, consumer-friendly wallet with beautiful mobile and browser interfaces.",
    downloadUrl: "https://lobstr.co/",
  },
  {
    id: "xbull",
    name: "xBull Wallet",
    icon: "🐂",
    description: "A powerful developer-first browser extension wallet supporting advanced routing.",
    downloadUrl: "https://xbull.app/",
  },
  {
    id: "simulated",
    name: "Sandbox Simulator",
    icon: "⚙️",
    description: "Instant in-browser simulator. Automatically funds a Testnet address with 10,000 XLM.",
    downloadUrl: "#",
  },
];

interface WalletSelectorModalProps {
  onConnected: (walletId: WalletType) => void;
}

export default function WalletSelectorModal({ onConnected }: WalletSelectorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [onSelectCallback, setOnSelectCallback] = useState<((id: string) => void) | null>(null);
  const [detectedWallets, setDetectedWallets] = useState<Record<WalletType, boolean>>({
    freighter: false,
    albedo: false,
    lobstr: false,
    xbull: false,
    simulated: true,
  });

  // Detect which wallet extensions are installed on mount
  useEffect(() => {
    const detect = () => {
      setDetectedWallets({
        freighter: typeof (window as any).stellarKeystore !== "undefined",
        albedo: typeof (window as any).albedo !== "undefined",
        lobstr: typeof (window as any).lobstr !== "undefined",
        xbull: typeof (window as any).xbull !== "undefined",
        simulated: true,
      });
    };

    // Run immediately and again after load to catch slow loaders
    detect();
    window.addEventListener("load", detect);
    return () => window.removeEventListener("load", detect);
  }, []);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ onSelect: (id: string) => void }>;
      setOnSelectCallback(() => customEvent.detail.onSelect);
      setIsOpen(true);
    };

    window.addEventListener("stellar-wallet-modal-open", handleOpen);
    return () => window.removeEventListener("stellar-wallet-modal-open", handleOpen);
  }, []);

  const handleSelect = (walletId: WalletType) => {
    if (onSelectCallback) {
      onSelectCallback(walletId);
    }
    onConnected(walletId);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="wallet-modal-overlay">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            id="wallet-modal-card"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-white">
                    Connect Wallet
                  </h3>
                  <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                    Choose your preferred Stellar connection method
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                id="wallet-modal-close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto p-4 space-y-3">
              {WALLET_OPTIONS.map((wallet) => {
                const isDetected = detectedWallets[wallet.id];
                const isSimulated = wallet.id === "simulated";

                return (
                  <div
                    key={wallet.id}
                    onClick={() => handleSelect(wallet.id)}
                    className="group flex cursor-pointer items-start gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/20 dark:border-slate-800 dark:hover:border-blue-900 dark:hover:bg-blue-950/10"
                    id={`wallet-option-${wallet.id}`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-2xl group-hover:bg-blue-50 dark:bg-slate-800 dark:group-hover:bg-blue-950">
                      {wallet.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">
                          {wallet.name}
                        </span>
                        {isDetected && !isSimulated && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 font-sans text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                            <Check className="h-3 w-3" /> Installed
                          </span>
                        )}
                        {isSimulated && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-sans text-[10px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                            Recommended for Testing
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {wallet.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning / Education Footer */}
            <div className="bg-slate-50 p-4 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <Shield className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="font-sans text-[11px] text-slate-500 leading-normal dark:text-slate-400">
                TaskLedger is a decentralized application on the Stellar network. We do not store or manage your secret keys. All transaction signing takes place safely inside your installed extension or the local simulator sandboxed environment.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
