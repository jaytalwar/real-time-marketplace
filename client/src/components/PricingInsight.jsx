import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Loader2, Sparkles, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

import { getPricingInsight } from "../services/productService";
import { formatPrice } from "../utils/format";
import Button from "./ui/Button";

export default function PricingInsight({ productId, onApply }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!productId) return;

    let active = true;
    setLoading(true);
    setError(false);

    getPricingInsight(productId)
      .then((data) => active && setInsight(data))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [productId]);

  if (!productId) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        <Loader2 size={15} className="animate-spin" /> Analyzing demand and inventory signals…
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Pricing insight isn't available for this product right now.
      </div>
    );
  }

  const changed = insight.recommendedPrice !== insight.currentPrice;
  const up = insight.recommendedPrice > insight.currentPrice;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={15} className="text-accent-500" />
        <h3 className="text-sm font-bold text-slate-900">Pricing insight</h3>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs text-slate-400">Current price</p>
          <p className="text-lg font-bold text-slate-800">{formatPrice(insight.currentPrice)}</p>
        </div>

        {changed && (
          <>
            <ArrowRight size={16} className="text-slate-300" />
            <div>
              <p className="text-xs text-slate-400">Suggested price</p>
              <p
                className={`flex items-center gap-1 text-lg font-bold ${up ? "text-emerald-600" : "text-amber-600"}`}
              >
                {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {formatPrice(insight.recommendedPrice)}
                <span className="text-xs font-medium text-slate-400">
                  ({insight.changePercent > 0 ? "+" : ""}
                  {insight.changePercent}%)
                </span>
              </p>
            </div>
          </>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500">{insight.summary}</p>

      {insight.drivers.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {insight.drivers.map((d) => (
            <li key={d.signal} className="flex items-start gap-2 text-xs text-slate-600">
              <span
                className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  d.direction === "up" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span>
                <span className="font-semibold text-slate-700">{d.label}:</span> {d.detail}
              </span>
            </li>
          ))}
        </ul>
      )}

      {changed && onApply && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => {
            onApply(insight.recommendedPrice);
            toast.success(`Price field updated to ${formatPrice(insight.recommendedPrice)}`);
          }}
        >
          Apply suggested price
        </Button>
      )}
    </div>
  );
}
