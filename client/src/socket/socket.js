import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const socket = io(apiUrl.replace(/\/api\/?$/, ""), {
  autoConnect: true,
});

export default socket;