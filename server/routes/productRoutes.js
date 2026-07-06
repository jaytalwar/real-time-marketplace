import express from "express";

import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} from "../controllers/productController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router
    .route("/")
    .get(getProducts)
    .post(
        protect,
        authorize("seller", "admin"),
        createProduct
    );

router
    .route("/:id")
    .get(getProductById)
    .put(
        protect,
        authorize("seller", "admin"),
        updateProduct
    )
    .delete(
        protect,
        authorize("seller", "admin"),
        deleteProduct
    );

export default router;