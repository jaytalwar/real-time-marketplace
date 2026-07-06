import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { getIO } from "../socket/socket.js";

// Create Order
export const createOrder = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: "Order must contain at least one item",
            });
        }

        let total = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({
                    message: `Product not found: ${item.product}`,
                });
            }

            orderItems.push({
                product: product._id,
                quantity: item.quantity,
            });

            total += product.price * item.quantity;
        }

        const order = await Order.create({
            buyer: req.user._id,
            items: orderItems,
            total,
        });

        res.status(201).json(order);

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Buyer Orders
export const getMyOrders = async (req, res) => {

    try {

        const orders = await Order.find({
            buyer: req.user._id,
        })
        .populate("items.product")
        .sort({ createdAt: -1 });

        res.json(orders);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

// Seller/Admin Orders
export const getAllOrders = async (req, res) => {

    try {

        const orders = await Order.find()
            .populate("buyer", "name email")
            .populate("items.product");

        res.json(orders);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

// Update Status

export const updateOrderStatus = async (req, res) => {

    try {

        const order = await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({
                message: "Order not found",
            });

        }

        order.status = req.body.status;

await order.save();


const io = getIO();

io.to(order._id.toString()).emit(
    "orderStatusUpdated",
    {
        orderId: order._id,
        status: order.status,
        updatedAt: order.updatedAt
    }
);

res.json(order);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};