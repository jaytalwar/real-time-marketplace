import asyncHandler from "../utils/asyncHandler.js";
import * as orderService from "../services/orderService.js";

// @desc Create Order
// @route POST /api/orders
// @access Buyer
export const createOrder = asyncHandler(async (req, res) => {
    const idempotencyKey = req.get("Idempotency-Key");
    const { order, replay } = await orderService.createOrder(
        req.user._id,
        req.body.items,
        idempotencyKey
    );

    res.status(replay ? 200 : 201).json(order);
});

// @desc Buyer's own orders
// @route GET /api/orders/my
// @access Buyer
export const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getMyOrders(req.user._id);
    res.json(orders);
});

// @desc Orders visible to the requester (own products for sellers, all for admin)
// @route GET /api/orders/all
// @access Seller/Admin
export const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getOrdersForRequester(req.user);
    res.json(orders);
});

// @desc Update order status
// @route PATCH /api/orders/:id/status
// @access Seller/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.user);
    res.json(order);
});
