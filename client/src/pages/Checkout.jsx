import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Truck, Wallet, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../services/orderService";
import Button from "../components/ui/Button";
import { formatPrice } from "../utils/format";

export default function Checkout() {
  const { items, subtotal, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  // Stable for the lifetime of this checkout attempt, so a double-click or a
  // retried request after a network hiccup can't create two orders — the
  // server recognizes the repeated key and replays the first result instead.
  // A fresh key is generated only when this page is mounted again (e.g. a
  // genuinely new checkout after the previous one completed).
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const placeOrder = async () => {
    setPlacing(true);
    try {
      await createOrder(
        items.map(({ product, quantity }) => ({ product: product._id, quantity })),
        idempotencyKeyRef.current
      );
      toast.success("Order placed successfully");
      navigate("/orders", { replace: true });
      clearCart();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Truck size={16} className="text-brand-700" /> Delivery details
            </h2>
            <p className="text-sm text-slate-600">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Wallet size={16} className="text-brand-700" /> Payment method
            </h2>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="radio" checked readOnly className="accent-accent-500" />
              Cash on Delivery
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold text-slate-800">
              Items ({itemCount})
            </h2>
            <div className="divide-y divide-slate-100">
              {items.map(({ product, quantity }) => (
                <div key={product._id} className="flex items-center gap-3 py-2.5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {product.image && (
                      <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-slate-800">{product.title}</p>
                    <p className="text-xs text-slate-400">Qty: {quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {formatPrice(product.price * quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-fit space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
              Price Summary
            </h2>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
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

            <Button size="lg" className="mt-4 w-full" loading={placing} onClick={placeOrder}>
              Place Order
            </Button>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck size={13} /> Order status updates live via Socket.io
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
