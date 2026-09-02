import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import http from "http";
import { Server } from "socket.io";
import { initializeSocket, registerSocketHandlers } from "./socket/socket.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import "./config/redis.js";

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
    },
});

initializeSocket(io);
registerSocketHandlers(io);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
    res.send("Marketplace API Running");
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
