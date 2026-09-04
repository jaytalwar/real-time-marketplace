import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Radio } from "lucide-react";
import toast from "react-hot-toast";

import { getMyOrders, getAllOrders, updateStatus } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import socket, { joinOrderRoom, joinSellerRoom } from "../socket/socket";
import OrderStatusStepper from "../components/OrderStatusStepper";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { ProductGridSkeleton } from "../components/ui/Skeleton";
import { ORDER_STATUSES } from "../utils/constants";
import { formatDateTime, formatPrice } from "../utils/format";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const orderIdsRef = useRef([]);

  const fetchOrders = async () => {
    try {
      const data = user.role === "buyer" ? await getMyOrders() : await getAllOrders();
      setOrders(data);
      orderIdsRef.current = data.map((order) => order._id);
      data.forEach((order) => joinOrderRoom(order._id));
      if (user.role !== "buyer") joinSellerRoom(user._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // socket.io's own reconnection logic re-establishes the transport, but room
  // membership doesn't survive a disconnect — without this, a dropped
  // connection silently stops delivering order updates until a manual reload.
  useEffect(() => {
    const rejoin = () => {
      orderIdsRef.current.forEach((id) => joinOrderRoom(id));
      if (user.role !== "buyer") joinSellerRoom(user._id);
    };

    socket.on("connect", rejoin);
    return () => socket.off("connect", rejoin);
  }, [user]);

  useEffect(() => {
    const handler = (data) => {
      setOrders((prev) =>
        prev.map((order) =>
          order._id === data.orderId ? { ...order, status: data.status } : order
        )
      );
      toast.success(`Order status updated to "${data.status}"`, { icon: "📦" });
    };

    socket.on("orderStatusUpdated", handler);
    return () => socket.off("orderStatusUpdated", handler);
  }, []);

  useEffect(() => {
    if (user.role === "buyer") return;

    const handler = () => {
      toast.success("New order received", { icon: "🛒" });
      fetchOrders();
    };

    socket.on("order:new", handler);
    return () => socket.off("order:new", handler);
  }, [user]);

  const changeStatus = async (id, status) => {
    const prev = orders;
    setOrders((o) => o.map((ord) => (ord._id === id ? { ...ord, status } : ord)));

    try {
      await updateStatus(id, status);
    } catch (err) {
      setOrders(prev);
      toast.error(err.response?.data?.message || "Could not update status");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={Package}
          title="No orders yet"
          description={
            user.role === "buyer"
              ? "Once you place an order, you'll be able to track it here in real time."
              : "Orders placed by buyers will show up here."
          }
          action={
            user.role === "buyer" && (
              <Button as={Link} to="/products">
                Start shopping
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">
          {user.role === "buyer" ? "My Orders" : "All Orders"}
        </h1>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <Radio size={13} className="animate-pulse" /> Live updates
        </span>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs text-slate-400">Order #{order._id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-slate-400">{formatDateTime(order.createdAt)}</p>
              </div>
              {user.role !== "buyer" && (
                <p className="text-sm font-medium text-slate-700">
                  {order.buyer?.name} <span className="text-slate-400">· {order.buyer?.email}</span>
                </p>
              )}
              <p className="text-base font-bold text-slate-900">{formatPrice(order.total)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 py-3">
              {order.items.map((item) => (
                <div
                  key={item.product?._id || item.product}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5"
                >
                  <div className="h-8 w-8 overflow-hidden rounded bg-slate-200">
                    {item.product?.image && (
                      <img src={item.product.image} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <span className="max-w-[140px] truncate text-xs text-slate-600">
                    {item.product?.title || "Product"} × {item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <OrderStatusStepper status={order.status} />
            </div>

            {user.role !== "buyer" && (
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <label className="text-xs font-medium text-slate-500">Update status:</label>
                <select
                  value={order.status}
                  onChange={(e) => changeStatus(order._id, e.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
