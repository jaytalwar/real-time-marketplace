import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

let io;

export const initializeSocket = (socketInstance) => {
    io = socketInstance;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }

    return io;
};

const verifySocketUser = async (token) => {
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await User.findById(decoded.id).select("-password");
    } catch {
        return null;
    }
};

const canAccessOrder = async (order, user) => {
    if (!order || !user) return false;
    if (user.role === "admin") return true;
    if (order.buyer.toString() === user._id.toString()) return true;

    const ownProductIds = await Product.find({ seller: user._id }).distinct("_id");
    const ownIds = new Set(ownProductIds.map((id) => id.toString()));
    return order.items.some((item) => ownIds.has(item.product.toString()));
};

export const registerSocketHandlers = (ioInstance) => {
    ioInstance.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // Order status updates: only the buyer, a seller with an item in the
        // order, or an admin may join the room for that order.
        socket.on("joinOrder", async ({ orderId, token } = {}) => {
            const user = await verifySocketUser(token);
            const order = orderId ? await Order.findById(orderId) : null;

            if (await canAccessOrder(order, user)) {
                socket.join(orderId);
            } else {
                socket.emit("errorMessage", "Not authorized to join this order");
            }
        });

        // Seller live order feed: a socket may only join its own seller room.
        socket.on("joinSeller", async ({ sellerId, token } = {}) => {
            const user = await verifySocketUser(token);

            if (user && (user._id.toString() === sellerId || user.role === "admin")) {
                socket.join(`seller:${sellerId}`);
            }
        });

        // Live inventory updates on a product page — public, no auth needed.
        socket.on("joinProduct", (productId) => {
            if (productId) socket.join(`product:${productId}`);
        });

        socket.on("leaveProduct", (productId) => {
            if (productId) socket.leave(`product:${productId}`);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });
};
