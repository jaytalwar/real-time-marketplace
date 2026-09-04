import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, Search, Pencil, Trash2, Boxes, Eye, PackageX, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";

import { getMyProducts, deleteProduct } from "../services/productService";
import Button from "../components/ui/Button";
import StockBadge from "../components/ui/StockBadge";
import EmptyState from "../components/ui/EmptyState";
import { ProductGridSkeleton } from "../components/ui/Skeleton";
import { formatPrice } from "../utils/format";

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className={`rounded-lg p-2.5 ${tint}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getMyProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;

    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete product");
    }
  };

  const stats = useMemo(() => {
    const totalStock = products.reduce((s, p) => s + p.stock, 0);
    const totalViews = products.reduce((s, p) => s + (p.views || 0), 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    return { totalStock, totalViews, lowStock, count: products.length };
  }, [products]);

  const chartData = useMemo(
    () =>
      [...products]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 8)
        .map((p) => ({
          name: p.title.length > 12 ? `${p.title.slice(0, 12)}…` : p.title,
          views: p.views || 0,
          stock: p.stock,
        })),
    [products]
  );

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Seller Dashboard</h1>
          <p className="text-sm text-slate-500">Manage your listings and track performance</p>
        </div>
        <Button as={Link} to="/seller/add">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={LayoutGrid} label="Products" value={stats.count} tint="bg-brand-50 text-brand-700" />
        <StatCard icon={Boxes} label="Total stock" value={stats.totalStock} tint="bg-emerald-50 text-emerald-700" />
        <StatCard icon={Eye} label="Total views" value={stats.totalViews} tint="bg-accent-50 text-accent-700" />
        <StatCard icon={PackageX} label="Low stock" value={stats.lowStock} tint="bg-amber-50 text-amber-700" />
      </div>

      {chartData.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-800">Views by product</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="views" fill="#fb5f17" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 sm:max-w-xs">
        <Search size={15} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your products"
          className="w-full text-sm outline-none"
        />
      </div>

      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No products listed yet"
          description="Add your first product to start selling on Kartly."
          action={
            <Button as={Link} to="/seller/add">
              <Plus size={16} /> Add Product
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60">
                    <td className="flex items-center gap-3 px-4 py-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {p.image && <img src={p.image} alt={p.title} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium text-slate-800">{p.title}</p>
                        <p className="text-xs text-slate-400">{p.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <StockBadge stock={p.stock} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.views || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/seller/edit/${p._id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-danger-600 hover:bg-danger-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
