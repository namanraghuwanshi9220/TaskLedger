import { useState } from "react";
import { PlusCircle, Calendar, AlertCircle } from "lucide-react";

interface CreateTaskFormProps {
  onAddTask: (title: string, description: string, deadline: number) => Promise<void>;
  isConnected: boolean;
}

export default function CreateTaskForm({ onAddTask, isConnected }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isConnected) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    if (!deadlineDate) {
      setError("Please specify a deadline date.");
      return;
    }

    // Set default time if empty
    const timeStr = deadlineTime || "23:59";
    const localDateTime = new Date(`${deadlineDate}T${timeStr}`);
    const timestampSeconds = Math.floor(localDateTime.getTime() / 1000);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (timestampSeconds <= nowSeconds) {
      setError("The deadline must be in the future.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTask(title.trim(), description.trim(), timestampSeconds);
      // Reset form on success
      setTitle("");
      setDescription("");
      setDeadlineDate("");
      setDeadlineTime("");
    } catch (err: any) {
      setError(err?.message || "Failed to submit transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl flex flex-col h-full" id="create-task-container">
      <div className="mb-4 flex items-center gap-2">
        <PlusCircle className="h-5 w-5 text-indigo-400" />
        <h3 className="font-sans text-sm font-bold text-slate-100 uppercase tracking-wider">
          Create On-Chain Task
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Task Title
            </label>
            <input
              type="text"
              required
              maxLength={60}
              placeholder="e.g., Audit smart contracts, Refactor codebase"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-sans text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-hidden"
              id="input-task-title"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Description
            </label>
            <textarea
              required
              rows={2}
              maxLength={200}
              placeholder="Provide a clear completion criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-sans text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-hidden resize-none"
              id="input-task-desc"
            />
          </div>

          {/* Deadline Group */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-600" />
                Date
              </label>
              <input
                type="date"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-sans text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                id="input-task-date"
              />
            </div>
            <div className="space-y-1">
              <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Time (Optional)
              </label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-sans text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                id="input-task-time"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-950/20 p-3 text-rose-400 border border-rose-900/40 mb-3" id="create-task-error">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="font-sans text-[11px] font-medium leading-normal">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 font-sans text-xs font-bold text-white shadow-md border border-indigo-400/20 transition-all disabled:opacity-50"
            id="btn-create-task"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Preparing transaction...
              </>
            ) : (
              "Deploy Task to Blockchain"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
