import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Store,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

import { getProductById, getProducts } from "../services/productService";
import { useCart } from "../context/CartContext";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import StockBadge from "../components/ui/StockBadge";
import PriceTag from "../components/ui/PriceTag";
import { Line } from "../components/ui/Skeleton";
import ProductCard from "../components/ProductCard";
import AssistantChat from "../components/AssistantChat";
import { formatDate } from "../utils/format";

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [showAsk, setShowAsk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setQty(1);

    getProductById(id)
      .then((data) => {
        setProduct(data);
        return getProducts(1, "", data.category, "-views", 6);
      })
      .then((relatedData) => {
        setRelated((relatedData?.products || []).filter((p) => p._id !== id));
      })
      .catch(() => toast.error("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 md:grid-cols-2">
        <Line className="aspect-square w-full rounded-2xl" />
        <div className="space-y-3">
          <Line className="h-6 w-3/4" />
          <Line className="h-4 w-1/3" />
          <Line className="h-8 w-1/4" />
          <Line className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) return null;

  const outOfStock = product.stock <= 0;

  const buyNow = () => {
    if (outOfStock) return;
    addToCart(product, qty);
    navigate("/checkout");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-700">Home</Link>
        <ChevronRight size={12} />
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-brand-700">
          {product.category}
        </Link>
        <ChevronRight size={12} />
        <span className="line-clamp-1 text-slate-700">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="group aspect-square w-full overflow-hidden bg-slate-100">
            {product.image ? (
              <img
                src={product.image}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                No image available
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Badge variant="brand">{product.category}</Badge>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{product.title}</h1>
            <p className="mt-1 text-xs text-slate-400">Listed {formatDate(product.createdAt)}</p>
          </div>

          <div className="flex items-center gap-3">
            <PriceTag price={product.price} size="lg" />
            <StockBadge stock={product.stock} />
          </div>

          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {product.description}
          </p>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Store size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Sold by</p>
              <p className="text-sm font-semibold text-slate-800">{product.seller?.name}</p>
            </div>
          </div>

          {!outOfStock && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Quantity</span>
              <div className="flex items-center overflow-hidden rounded-lg border border-slate-300">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={outOfStock}
              onClick={() => addToCart(product, qty)}
            >
              <ShoppingCart size={17} /> Add to Cart
            </Button>
            <Button variant="primary" size="lg" className="flex-1" disabled={outOfStock} onClick={buyNow}>
              <Zap size={17} /> Buy Now
            </Button>
          </div>

          <button
            onClick={() => setShowAsk((s) => !s)}
            className="flex items-center gap-2 self-start rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
          >
            <Sparkles size={16} className="text-accent-500" />
            {showAsk ? "Hide AI assistant" : "Ask AI about this product"}
          </button>

          {showAsk && (
            <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <AssistantChat
                compact
                productContext={{
                  title: product.title,
                  description: product.description,
                  price: product.price,
                  category: product.category,
                  stock: product.stock,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Related products</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {related.slice(0, 6).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
