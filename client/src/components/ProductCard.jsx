import { Link } from "react-router-dom";
import { ShoppingCart, Flame, Sparkle } from "lucide-react";
import { formatPrice } from "../utils/format";
import { isNewArrival } from "../utils/format";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const outOfStock = product.stock <= 0;
  const trending = (product.views || 0) >= 20;
  const fresh = isNewArrival(product.createdAt);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (outOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    addToCart(product, 1);
  };

  return (
    <Link
      to={`/product/${product._id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            No image
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {fresh && (
            <span className="flex items-center gap-1 rounded-full bg-brand-900/90 px-2 py-0.5 text-[10px] font-bold text-white">
              <Sparkle size={10} /> NEW
            </span>
          )}
          {trending && (
            <span className="flex items-center gap-1 rounded-full bg-accent-500/95 px-2 py-0.5 text-[10px] font-bold text-white">
              <Flame size={10} /> TRENDING
            </span>
          )}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-slate-700">
            Out of stock
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-900 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
          aria-label="Add to cart"
        >
          <ShoppingCart size={15} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {product.category}
        </p>
        <h3 className="line-clamp-2 text-sm font-medium text-slate-800">{product.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <span className="text-base font-bold text-slate-900">{formatPrice(product.price)}</span>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-[11px] font-semibold text-amber-600">
              {product.stock} left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
