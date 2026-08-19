import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import AssistantChat from "./AssistantChat";

export default function AIAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-brand-950 px-4 py-3 text-sm font-semibold text-white shadow-pop transition-transform hover:scale-105"
      >
        {open ? <X size={18} /> : <Sparkles size={18} className="text-accent-300" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask AI"}</span>
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[70vh] max-h-[600px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
          <div className="flex items-center gap-2 bg-brand-950 px-4 py-3 text-white">
            <Sparkles size={16} className="text-accent-300" />
            <p className="text-sm font-semibold">Kartly AI Assistant</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <AssistantChat compact />
          </div>
        </div>
      )}
    </>
  );
}
