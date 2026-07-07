import { useEffect, useState } from "react";
import {
  getMyOrders,
  getAllOrders,
  updateStatus,
} from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import socket from "../socket/socket";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        let data;

        if (user.role === "buyer") {
          data = await getMyOrders();
        } else {
          data = await getAllOrders();
        }

        setOrders(data);

        data.forEach((order) => {
          socket.emit("joinOrder", order._id);
        });
      } catch (err) {
        console.log(err);
      }
    };

    fetchOrders();
  }, [user]);

  useEffect(() => {
    socket.on("orderStatusUpdated", (data) => {
      setOrders((prev) =>
        prev.map((order) =>
          order._id === data.orderId
            ? { ...order, status: data.status }
            : order
        )
      );
    });

    return () => socket.off("orderStatusUpdated");
  }, []);

  const changeStatus = async (id, status) => {
    await updateStatus(id, status);

    setOrders((prev) =>
      prev.map((order) =>
        order._id === id
          ? { ...order, status }
          : order
      )
    );
  };

  return (
    <div className="container" style={{ padding: "30px" }}>
      <h1>Orders</h1>

      <table
        border="1"
        cellPadding="10"
        style={{
          width: "100%",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th>Buyer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Items</th>

            {user.role !== "buyer" && <th>Action</th>}
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>
                {order.buyer?.name || "You"}
              </td>

              <td>₹{order.total}</td>

              <td>{order.status}</td>

              <td>
                {order.items.length}
              </td>

              {user.role !== "buyer" && (
                <td>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      changeStatus(
                        order._id,
                        e.target.value
                      )
                    }
                  >
                    <option>Pending</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}