import { Sparkles } from "lucide-react";
import AssistantChat from "../components/AssistantChat";

export default function Assistant() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-brand-950 p-2.5 text-accent-300">
          <Sparkles size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Shopping Assistant</h1>
          <p className="text-sm text-slate-500">
            Powered by Claude — describe what you're looking for in plain English.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <AssistantChat />
      </div>
    </div>
  );
}
