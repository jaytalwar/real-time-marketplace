import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { askAssistant } from "../services/aiService";
import { getProducts } from "../services/productService";
import { formatPrice } from "../utils/format";

const SUGGESTIONS = [
  "Show me electronics under 2000",
  "What's trending right now?",
  "I need a birthday gift under 1500",
  "Find affordable home essentials",
];

const buildFilterQuery = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.sort) params.set("sort", filters.sort);
  return params.toString();
};

export default function AssistantChat({ compact = false, productContext = null }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: productContext
        ? `Ask me anything about "${productContext.title}" — specs, fit, whether it's worth it, or how it compares.`
        : "Hi! I'm your Kartly shopping assistant. Ask me to find products, compare prices, or suggest something to buy.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const history = nextMessages
        .slice(-8)
        .map((m) => ({ role: m.role, text: m.text }));

      const { reply, filters } = await askAssistant(trimmed, history, productContext);

      let products = [];
      if (!productContext && filters && Object.keys(filters).length > 0) {
        try {
          const data = await getProducts(
            1,
            filters.search || "",
            filters.category || "",
            filters.sort || "-createdAt",
            4,
            filters.minPrice,
            filters.maxPrice
          );
          products = data.products || [];
        } catch {
          products = [];
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: reply, products, filters },
      ]);
    } catch (err) {
      if (err.response?.status === 503) {
        setUnavailable(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "The AI assistant isn't configured on this deployment yet — an ANTHROPIC_API_KEY is missing on the server.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Sorry, something went wrong. Please try again." },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex h-full flex-col ${compact ? "" : "min-h-[520px]"}`}>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-brand-900 text-white"
                  : "rounded-bl-sm bg-slate-100 text-slate-800"
              }`}
            >
              <p>{m.text}</p>

              {m.products && m.products.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {m.products.map((p) => (
                    <Link
                      key={p._id}
                      to={`/product/${p._id}`}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-800 transition-shadow hover:shadow-md"
                    >
                      <div className="aspect-square w-full overflow-hidden rounded-md bg-slate-100">
                        {p.image && (
                          <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs font-medium">{p.title}</p>
                      <p className="text-xs font-bold text-accent-600">{formatPrice(p.price)}</p>
                    </Link>
                  ))}
                </div>
              )}

              {m.filters && Object.keys(m.filters).length > 0 && (
                <Link
                  to={`/products?${buildFilterQuery(m.filters)}`}
                  className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline"
                >
                  View all results →
                </Link>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" /> Thinking…
            </div>
          </div>
        )}

        {unavailable && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Set <code className="rounded bg-amber-100 px-1">ANTHROPIC_API_KEY</code> in the server
            environment to enable the assistant.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && !productContext && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-accent-300 hover:text-accent-600"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-slate-200 p-3"
      >
        <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
          <Sparkles size={15} className="text-accent-500" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about products, prices, gifts…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white transition-colors hover:bg-accent-600 disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
