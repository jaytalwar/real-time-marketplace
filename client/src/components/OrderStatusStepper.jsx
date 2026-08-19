import { Check } from "lucide-react";
import { ORDER_STATUSES } from "../utils/constants";

export default function OrderStatusStepper({ status }) {
  const currentIndex = ORDER_STATUSES.indexOf(status);

  return (
    <div className="flex w-full items-center">
      {ORDER_STATUSES.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;

        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-accent-500 text-white ring-4 ring-accent-100"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span
                className={`hidden text-center text-[10px] font-medium sm:block ${
                  active ? "text-accent-600" : done ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {step}
              </span>
            </div>

            {i < ORDER_STATUSES.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 rounded ${
                  i < currentIndex ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
