import express from "express";

import {
    createOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
} from "../controllers/orderController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("buyer"),
    createOrder
);

router.get(
    "/my",
    protect,
    authorize("buyer"),
    getMyOrders
);

router.get(
    "/all",
    protect,
    authorize("seller", "admin"),
    getAllOrders
);

router.patch(
    "/:id/status",
    protect,
    authorize("seller", "admin"),
    updateOrderStatus
);

export default router;