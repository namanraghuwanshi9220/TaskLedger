import { useState } from "react";
import { motion } from "motion/react";
import { Clock, CheckCircle2, AlertCircle, ArrowLeftRight, User, Copy, Check, ExternalLink } from "lucide-react";
import { Task } from "../types";

interface TaskCardProps {
  task: Task;
  currentAddress: string | null;
  onComplete: (id: number) => Promise<void>;
  onTransfer: (id: number, newOwner: string) => Promise<void>;
}

export default function TaskCard({ task, currentAddress, onComplete, onTransfer }: TaskCardProps) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [transferError, setTransferError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  const isOwner = currentAddress && currentAddress.toLowerCase() === task.owner.toLowerCase();
  
  // Format Address (Truncated)
  const formatAddress = (addr: string) => {
    if (addr.length < 12) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}`;
  };

  // Copy address to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Calculate deadline countdown
  const getDeadlineStatus = () => {
    const now = Math.floor(Date.now() / 1000);
    const diff = task.deadline - now;

    if (task.isCompleted) {
      return {
        text: "Completed",
        color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
        isOverdue: false,
      };
    }

    if (diff < 0) {
      const hoursAgo = Math.abs(Math.floor(diff / 3600));
      const daysAgo = Math.floor(hoursAgo / 24);
      const text = daysAgo > 0 ? `Past deadline by ${daysAgo}d` : `Past deadline by ${hoursAgo}h`;
      return {
        text,
        color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/40",
        isOverdue: true,
      };
    }

    const hoursLeft = Math.floor(diff / 3600);
    const daysLeft = Math.floor(hoursLeft / 24);

    if (daysLeft > 0) {
      return {
        text: `${daysLeft}d left`,
        color: "text-slate-600 bg-slate-50 dark:bg-slate-800/60 dark:text-slate-300 border-slate-100 dark:border-slate-800",
        isOverdue: false,
      };
    } else {
      return {
        text: `${hoursLeft}h left`,
        color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
        isOverdue: false,
      };
    }
  };

  const dlStatus = getDeadlineStatus();

  // Complete Task Trigger
  const handleCompleteClick = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      await onComplete(task.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompleting(false);
    }
  };

  // Transfer Ownership Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError("");

    if (!newOwnerAddress.trim()) {
      setTransferError("Owner address cannot be empty");
      return;
    }

    if (!newOwnerAddress.startsWith("G") || newOwnerAddress.length !== 56) {
      setTransferError("Stellar addresses must start with 'G' and be 56 characters long.");
      return;
    }

    if (newOwnerAddress.toLowerCase() === task.owner.toLowerCase()) {
      setTransferError("Cannot transfer ownership to the current owner.");
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      await onTransfer(task.id, newOwnerAddress.trim());
      setIsTransferring(false);
      setNewOwnerAddress("");
    } catch (err: any) {
      setTransferError(err?.message || "Transfer failed. Check address or network.");
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col overflow-hidden rounded-xl border p-5 transition-all duration-300 shadow-md ${
        task.isCompleted
          ? "border-emerald-500/20 bg-emerald-950/10"
          : dlStatus.isOverdue
          ? "border-rose-500/20 bg-rose-950/10"
          : "border-slate-800 bg-slate-950/40 hover:border-indigo-500/30 hover:bg-slate-950/70"
      }`}
      id={`task-card-${task.id}`}
    >
      {/* Upper Status indicators */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="font-mono text-xs text-slate-400">#Task-{task.id}</span>
        <div className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-sans text-xs font-medium ${dlStatus.color}`}>
          {task.isCompleted ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : dlStatus.isOverdue ? (
            <AlertCircle className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {dlStatus.text}
        </div>
      </div>

      {/* Title & Description */}
      <div className="flex-1 space-y-2">
        <h4 className={`font-sans text-sm font-bold tracking-tight text-slate-100 ${task.isCompleted ? "line-through opacity-50" : ""}`}>
          {task.title}
        </h4>
        <p className={`font-sans text-xs text-slate-400 leading-relaxed ${task.isCompleted ? "opacity-50" : ""}`}>
          {task.description}
        </p>
      </div>

      {/* Owner Badge */}
      <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-850 pt-3 gap-2">
        <div className="flex items-center gap-1.5 font-sans text-xs text-slate-400">
          <User className="h-3.5 w-3.5 text-slate-500" />
          <span>Owner:</span>
          <span className="font-mono text-[11px] font-medium text-slate-300">
            {formatAddress(task.owner)}
          </span>
          {isOwner && (
            <span className="rounded bg-indigo-950/50 border border-indigo-500/20 px-1.5 py-0.5 font-sans text-[9px] font-bold text-indigo-400">
              You
            </span>
          )}
        </div>

        {/* Explore and Copy */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleCopy(task.owner)}
            title="Copy address"
            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
          >
            {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${task.owner}`}
            target="_blank"
            rel="noreferrer referrerPolicy='no-referrer'"
            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
            title="View in Stellar.expert"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Owner Action Buttons */}
      {isOwner && !task.isCompleted && (
        <div className="mt-4 border-t border-slate-850 pt-3">
          {!isTransferring ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCompleteClick}
                disabled={isCompleting}
                className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 px-3 py-1.5 font-sans text-xs font-semibold text-white transition-all disabled:opacity-50"
                id={`btn-complete-${task.id}`}
              >
                {isCompleting ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Complete
              </button>
              <button
                onClick={() => setIsTransferring(true)}
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-800 px-3 py-1.5 font-sans text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800"
                id={`btn-transfer-init-${task.id}`}
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-400" />
                Transfer
              </button>
            </div>
          ) : (
            <form onSubmit={handleTransferSubmit} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Transfer Task Ownership
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsTransferring(false);
                    setTransferError("");
                  }}
                  className="font-sans text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <input
                type="text"
                placeholder="Recipient Address (G...)"
                value={newOwnerAddress}
                onChange={(e) => setNewOwnerAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 font-mono text-[10px] text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                id={`transfer-address-${task.id}`}
              />
              {transferError && (
                <p className="font-sans text-[10px] font-medium text-rose-500 leading-tight">
                  {transferError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmittingTransfer}
                className="w-full flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-1.5 font-sans text-xs font-bold text-white transition-all disabled:opacity-50"
                id={`btn-transfer-submit-${task.id}`}
              >
                {isSubmittingTransfer ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Confirm Transfer"
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </motion.div>
  );
}
