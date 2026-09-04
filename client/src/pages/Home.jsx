import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Radio, ShieldCheck, PackageSearch } from "lucide-react";

import { getProducts } from "../services/productService";
import ProductCard from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import useCategories from "../hooks/useCategories";
import { getCategoryIconComponent } from "../components/CategoryIcon";

function ProductRow({ title, subtitle, products, loading }) {
  if (!loading && products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        <Link
          to="/products"
          className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <ProductGridSkeleton count={5} />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-3 sm:overflow-visible md:grid-cols-4 lg:grid-cols-5">
          {products.map((p) => (
            <div key={p._id} className="w-40 shrink-0 sm:w-auto">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [fresh, setFresh] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const { categories } = useCategories();

  useEffect(() => {
    const load = async () => {
      try {
        const [trendingData, freshData, allData] = await Promise.all([
          getProducts(1, "", "", "-views", 10),
          getProducts(1, "", "", "-createdAt", 10),
          getProducts(1, "", "", "-createdAt", 15),
        ]);

        setTrending(trendingData.products || []);
        setFresh(freshData.products || []);
        setAll(allData.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-24">
          <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-accent-200">
            <Radio size={13} className="animate-pulse text-accent-300" />
            Live order tracking, powered by websockets
          </span>

          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Shop smarter with an <span className="text-accent-400">AI assistant</span> that
            knows your marketplace
          </h1>

          <p className="max-w-xl text-sm text-white/70 sm:text-base">
            Browse thousands of listings, track your orders in real time, and let our AI
            assistant find exactly what you need — just ask.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="rounded-xl bg-accent-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent-500/30 transition-transform hover:scale-105"
            >
              Start shopping
            </Link>
            <Link
              to="/assistant"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              <Sparkles size={16} className="text-accent-300" />
              Ask the AI assistant
            </Link>
          </div>

          <div className="mt-2 flex flex-wrap gap-6 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} /> Secure JWT auth
            </span>
            <span className="flex items-center gap-1.5">
              <Radio size={14} /> Real-time status via Socket.io
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} /> Claude-powered assistant
            </span>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Shop by category</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {categories.map((cat) => {
              const IconComp = getCategoryIconComponent(cat);
              return (
                <Link
                  key={cat}
                  to={`/products?category=${encodeURIComponent(cat)}`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-card-hover"
                >
                  <div className="rounded-full bg-brand-50 p-2.5 text-brand-700">
                    <IconComp size={20} />
                  </div>
                  <span className="line-clamp-1 text-xs font-medium text-slate-700">{cat}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <ProductRow
        title="Trending now"
        subtitle="Most viewed listings across the marketplace"
        products={trending}
        loading={loading}
      />

      <ProductRow
        title="New arrivals"
        subtitle="Freshly listed products"
        products={fresh}
        loading={loading}
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">All products</h2>
        {loading ? (
          <ProductGridSkeleton count={15} />
        ) : all.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No products yet"
            description="Once sellers start listing products, they'll show up here."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {all.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
