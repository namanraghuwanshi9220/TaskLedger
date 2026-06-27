import { useState } from "react";
import { Terminal, Copy, Check, ExternalLink, HelpCircle, Code, Award, Activity } from "lucide-react";

interface XdrInspectorProps {
  xdr: string | null;
  methodName: string | null;
  status: "success" | "pending" | "error" | null;
  events: Array<{ topic: string; value: string }> | null;
}

export default function XdrInspector({ xdr, methodName, status, events }: XdrInspectorProps) {
  const [activeTab, setActiveTab] = useState<"xdr" | "breakdown" | "events">("xdr");
  const [isCopied, setIsCopied] = useState(false);

  if (!xdr) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center h-full flex flex-col justify-center items-center" id="xdr-inspector-empty">
        <Terminal className="mx-auto h-7 w-7 text-slate-700 mb-2" />
        <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
          Transaction Inspector
        </h4>
        <p className="font-sans text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
          Create or interact with a task. The resulting raw transaction XDR and on-chain events will appear here for audit.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(xdr);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Human-friendly description based on method
  const getMethodExplanation = () => {
    switch (methodName) {
      case "create_task":
        return "Invokes the 'create_task' function on your Soroban smart contract, assigning ownership, a deadline timestamp, and allocating ledger footprint storage.";
      case "complete_task":
        return "Invokes the 'complete_task' function. It verifies that the caller matches the registered task owner address, checks that it is not already completed, and marks the task state permanently as true on-chain.";
      case "transfer_ownership":
        return "Invokes the 'transfer_ownership' function, transferring all administrative control and completion rights for this task ID from the current owner to a new Stellar public key address.";
      default:
        return "A host-function invocation payload designed for the Soroban smart contract runtime on Stellar.";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col h-full shadow-2xl" id="xdr-inspector-container">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/40 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-400" />
          <span className="font-sans text-xs font-bold text-slate-200">
            XDR Transaction Inspector
          </span>
          {status === "success" && (
            <span className="rounded-full bg-emerald-950/50 border border-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-400 animate-pulse">
              SUCCESS
            </span>
          )}
          {status === "pending" && (
            <span className="animate-pulse rounded-full bg-indigo-950/50 border border-indigo-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-indigo-400">
              SIGNING...
            </span>
          )}
        </div>

        {/* Action Link */}
        <a
          href={`https://laboratory.stellar.org/#xdr-viewer?input=${encodeURIComponent(xdr)}&type=TransactionEnvelope&network=testnet`}
          target="_blank"
          rel="noreferrer referrerPolicy='no-referrer'"
          className="flex items-center gap-1 font-sans text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Open in Stellar Lab
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs px-2 bg-slate-950/20">
        <button
          onClick={() => setActiveTab("xdr")}
          className={`px-3 py-2 font-sans font-bold border-b-2 transition-all ${
            activeTab === "xdr"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Raw XDR Payload
        </button>
        <button
          onClick={() => setActiveTab("breakdown")}
          className={`px-3 py-2 font-sans font-bold border-b-2 transition-all ${
            activeTab === "breakdown"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Soroban Breakdown
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`relative px-3 py-2 font-sans font-bold border-b-2 transition-all ${
            activeTab === "events"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Contract Events
          {events && events.length > 0 && (
            <span className="absolute top-1.5 right-1 h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 bg-slate-900/30 flex-1 flex flex-col justify-between">
        {activeTab === "xdr" && (
          <div className="space-y-3">
            <div className="relative rounded-xl bg-slate-950 border border-slate-850 p-3 text-slate-200">
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 rounded-lg bg-slate-900 border border-slate-800 p-1 text-slate-400 hover:text-white transition-colors"
                title="Copy raw XDR"
              >
                {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
              <pre className="font-mono text-[10px] whitespace-pre-wrap break-all pr-6 max-h-[120px] overflow-y-auto">
                {xdr}
              </pre>
            </div>
            <p className="font-sans text-[10px] text-slate-500 flex items-start gap-1 leading-relaxed">
              <HelpCircle className="h-3 w-3 mt-0.5 shrink-0 text-slate-500" />
              XDR is the standard serialization format used by the Stellar ledger. This contains key signatures, footprints, and transaction payloads.
            </p>
          </div>
        )}

        {activeTab === "breakdown" && (
          <div className="space-y-3 font-sans text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">Operation Type</span>
                <span className="font-mono font-bold text-indigo-400 flex items-center gap-1">
                  <Code className="h-3 w-3" /> Invoke Host Function
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">Smart Method</span>
                <span className="font-mono font-bold text-slate-200 bg-slate-850 px-1.5 py-0.5 rounded">
                  {methodName || "unknown_method"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">Target Network</span>
                <span className="font-semibold text-slate-300">Stellar Testnet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">Base Fee</span>
                <span className="font-mono font-semibold text-emerald-400">0.0001 XLM (100 Stroops)</span>
              </div>
            </div>
            <div className="bg-indigo-950/20 rounded-xl p-3 border border-indigo-500/10 flex gap-2">
              <Award className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-indigo-300 leading-relaxed">
                <strong>Mechanism:</strong> {getMethodExplanation()}
              </p>
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {events && events.length > 0 ? (
              events.map((evt, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-emerald-500/10 bg-emerald-950/5 p-2.5 flex items-start gap-2"
                >
                  <Activity className="h-3.5 w-3.5 text-emerald-500 mt-0.5" />
                  <div className="text-[11px]">
                    <span className="font-mono font-bold text-emerald-400">
                      Topic: {evt.topic}
                    </span>
                    <p className="font-mono text-slate-300 mt-0.5 break-all">
                      Data: {evt.value}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-500 font-sans text-[11px]" id="xdr-events-empty">
                No events emitted for the current transaction yet. Emitted topics will render here in real-time.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
