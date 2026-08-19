import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { formatPrice } from "../utils/format";

export default function Cart() {
  const { items, updateQuantity, removeFromCart, subtotal, itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const goToCheckout = () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Start exploring products."
          action={
            <Button as={Link} to="/products">
              Browse products
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-xl font-bold text-slate-900">
        Your Cart <span className="text-slate-400">({itemCount} items)</span>
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map(({ product, quantity }) => (
            <div
              key={product._id}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Link to={`/product/${product._id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {product.image && (
                  <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link to={`/product/${product._id}`} className="text-sm font-semibold text-slate-800 hover:text-brand-700">
                      {product.title}
                    </Link>
                    <p className="text-xs text-slate-400">{product.category}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(product._id)}
                    className="text-slate-400 hover:text-danger-600"
                    aria-label="Remove item"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center overflow-hidden rounded-lg border border-slate-300">
                    <button
                      onClick={() => updateQuantity(product._id, quantity - 1)}
                      disabled={quantity <= 1}
                      className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product._id, quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <span className="text-sm font-bold text-slate-900">
                    {formatPrice(product.price * quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
            Order Summary
          </h2>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal ({itemCount} items)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Delivery</span>
            <span className="font-semibold text-emerald-600">Free</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <Button size="lg" className="mt-4 w-full" onClick={goToCheckout}>
            Proceed to Checkout <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
