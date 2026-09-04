import mongoose from "mongoose";

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";
import { getIO } from "../socket/socket.js";
import {
    acquireIdempotencyLock,
    completeIdempotencyLock,
    releaseIdempotencyLock,
} from "./idempotencyService.js";

const MAX_TRANSACTION_ATTEMPTS = 5;

const isTransientTransactionError = (err) =>
    typeof err.hasErrorLabel === "function" && err.hasErrorLabel("TransientTransactionError");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One attempt at the order transaction. Each item is decremented with a
 * `$gte` stock guard so two concurrent requests can never both succeed
 * against the last unit — the loser gets a null result, which throws and
 * aborts the whole transaction (any items already decremented in this same
 * attempt roll back automatically, nothing partially applies).
 *
 * Real write contention on the same product document also surfaces here as
 * a `TransientTransactionError` from MongoDB — that's not a stock problem,
 * it's the database asking the *whole transaction* to be retried, which
 * `createOrder` below does.
 */
const attemptOrderTransaction = async (buyerId, items) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        let total = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { returnDocument: "after", session }
            );

            if (!product) {
                const original = await Product.findById(item.product).session(session);
                if (!original) {
                    throw new AppError(`Product not found: ${item.product}`, 404);
                }
                throw new AppError(
                    `${original.title} doesn't have enough stock (requested ${item.quantity}, available ${original.stock})`,
                    409
                );
            }

            orderItems.push({ product: product._id, quantity: item.quantity });
            total += product.price * item.quantity;
        }

        const [order] = await Order.create(
            [{ buyer: buyerId, items: orderItems, total }],
            { session }
        );

        await session.commitTransaction();
        await order.populate("items.product");

        return order;
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

export const createOrder = async (buyerId, items, idempotencyKey) => {
    const lock = await acquireIdempotencyLock(idempotencyKey);

    if (lock.replay) {
        const existing = await Order.findById(lock.orderId).populate("items.product");
        if (existing) return { order: existing, replay: true };
    }

    let lastError;

    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
        try {
            const order = await attemptOrderTransaction(buyerId, items);

            if (idempotencyKey) {
                await completeIdempotencyLock(idempotencyKey, order._id);
            }

            emitInventoryChanged(order.items);
            emitNewOrderToSellers(order);

            return { order, replay: false };
        } catch (err) {
            lastError = err;

            if (!isTransientTransactionError(err)) {
                if (idempotencyKey) await releaseIdempotencyLock(idempotencyKey);
                throw err;
            }

            // Genuine write contention, not a stock failure — back off briefly
            // (with jitter, so retries from competing requests don't re-collide
            // in lockstep) and let the database's own conflict resolution retry.
            await sleep(15 + Math.random() * 50 * attempt);
        }
    }

    if (idempotencyKey) await releaseIdempotencyLock(idempotencyKey);
    throw lastError;
};

export const getMyOrders = (buyerId) =>
    Order.find({ buyer: buyerId })
        .populate("items.product")
        .sort({ createdAt: -1 });

/**
 * Admins see every order. Sellers only see orders that contain at least one
 * of their own products (previously this returned every order in the
 * marketplace to any seller, regardless of ownership).
 */
export const getOrdersForRequester = async (user) => {
    if (user.role === "admin") {
        return Order.find()
            .populate("buyer", "name email")
            .populate("items.product")
            .sort({ createdAt: -1 });
    }

    const ownProductIds = await Product.find({ seller: user._id }).distinct("_id");

    return Order.find({ "items.product": { $in: ownProductIds } })
        .populate("buyer", "name email")
        .populate("items.product")
        .sort({ createdAt: -1 });
};

export const updateOrderStatus = async (orderId, status, requester) => {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);

    if (requester.role !== "admin") {
        const ownProductIds = await Product.find({ seller: requester._id }).distinct("_id");
        const ownIds = new Set(ownProductIds.map((id) => id.toString()));
        const ownsAnItem = order.items.some((item) => ownIds.has(item.product.toString()));

        if (!ownsAnItem) {
            throw new AppError("You can only update orders containing your own products", 403);
        }
    }

    order.status = status;
    await order.save();

    getIO()
        .to(order._id.toString())
        .emit("orderStatusUpdated", {
            orderId: order._id,
            status: order.status,
            updatedAt: order.updatedAt,
        });

    return order;
};

const emitInventoryChanged = (orderItems) => {
    try {
        const io = getIO();
        for (const item of orderItems) {
            const productId = item.product?._id || item.product;
            io.to(`product:${productId.toString()}`).emit("inventory:changed", {
                productId: productId.toString(),
            });
        }
    } catch {
        // Socket not initialized (e.g. in a test context) — safe to skip.
    }
};

const emitNewOrderToSellers = (order) => {
    try {
        const io = getIO();
        const sellerIds = new Set(
            order.items
                .map((item) => item.product?.seller?.toString())
                .filter(Boolean)
        );

        for (const sellerId of sellerIds) {
            io.to(`seller:${sellerId}`).emit("order:new", {
                orderId: order._id,
                total: order.total,
                itemCount: order.items.length,
            });
        }
    } catch {
        // Socket not initialized — safe to skip.
    }
};
