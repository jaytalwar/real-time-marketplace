import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const socket = io(apiUrl.replace(/\/api\/?$/, ""), {
  autoConnect: true,
});

const getToken = () => localStorage.getItem("token") || null;

export const joinOrderRoom = (orderId) => {
  socket.emit("joinOrder", { orderId, token: getToken() });
};

export const joinSellerRoom = (sellerId) => {
  socket.emit("joinSeller", { sellerId, token: getToken() });
};

export const joinProductRoom = (productId) => {
  socket.emit("joinProduct", productId);
};

export const leaveProductRoom = (productId) => {
  socket.emit("leaveProduct", productId);
};

export default socket;
