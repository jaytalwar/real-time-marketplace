import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";

import { getProducts } from "../services/productService";
import ProductCard from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import useCategories from "../hooks/useCategories";
import { SORT_OPTIONS } from "../utils/constants";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategories();

  const [data, setData] = useState({ products: [], currentPage: 1, totalPages: 1, totalProducts: 0 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "-createdAt";
  const page = Number(searchParams.get("page")) || 1;
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const [priceInputs, setPriceInputs] = useState({ min: minPrice, max: maxPrice });

  useEffect(() => {
    setPriceInputs({ min: minPrice, max: maxPrice });
  }, [minPrice, maxPrice]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getProducts(page, search, category, sort, 15, minPrice || undefined, maxPrice || undefined)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) setData({ products: [], currentPage: 1, totalPages: 1, totalProducts: 0 });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, category, sort, page, minPrice, maxPrice]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const applyPriceFilter = () => {
    const next = new URLSearchParams(searchParams);
    if (priceInputs.min) next.set("minPrice", priceInputs.min);
    else next.delete("minPrice");
    if (priceInputs.max) next.set("maxPrice", priceInputs.max);
    else next.delete("maxPrice");
    next.delete("page");
    setSearchParams(next);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setSearchParams({});
    setFiltersOpen(false);
  };

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeFilterCount = [category, minPrice, maxPrice].filter(Boolean).length;

  const FiltersPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-900">Category</h3>
        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="radio"
              name="category"
              checked={!category}
              onChange={() => updateParam("category", "")}
              className="accent-accent-500"
            />
            All categories
          </label>
          {categories.map((cat) => (
            <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="radio"
                name="category"
                checked={category === cat}
                onChange={() => updateParam("category", cat)}
                className="accent-accent-500"
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-900">Price range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={priceInputs.min}
            onChange={(e) => setPriceInputs((p) => ({ ...p, min: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={priceInputs.max}
            onChange={(e) => setPriceInputs((p) => ({ ...p, max: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={applyPriceFilter}>
          Apply
        </Button>
      </div>

      {activeFilterCount > 0 && (
        <Button size="sm" variant="ghost" className="w-full text-danger-600" onClick={clearFilters}>
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {search ? `Results for "${search}"` : category || "All Products"}
          </h1>
          {!loading && <p className="text-sm text-slate-500">{data.totalProducts} products found</p>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 lg:hidden"
          >
            <SlidersHorizontal size={15} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-4">
            {FiltersPanel}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {loading ? (
            <ProductGridSkeleton count={15} />
          ) : data.products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              description="Try adjusting your filters or search term."
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {data.products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {data.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="px-3 text-sm font-medium text-slate-600">
                    Page {data.currentPage} of {data.totalPages}
                  </span>

                  <button
                    disabled={page >= data.totalPages}
                    onClick={() => goToPage(page + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Filters</h3>
              <button onClick={() => setFiltersOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {FiltersPanel}
          </div>
        </div>
      )}
    </div>
  );
}
