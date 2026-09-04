import express from "express";

import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getMyProducts,
    getPricingInsight,
    getRecommendations,
} from "../controllers/productController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
    createProductSchema,
    updateProductSchema,
    listProductsSchema,
    productIdParamSchema,
} from "../validation/schemas.js";

const router = express.Router();

router
    .route("/")
    .get(validate(listProductsSchema), getProducts)
    .post(
        protect,
        authorize("seller", "admin"),
        validate(createProductSchema),
        createProduct
    );

router.get(
    "/my-products",
    protect,
    authorize("seller", "admin"),
    getMyProducts
);

router.get(
    "/:id/pricing-insight",
    protect,
    authorize("seller", "admin"),
    validate(productIdParamSchema),
    getPricingInsight
);

router.get(
    "/:id/recommendations",
    validate(productIdParamSchema),
    getRecommendations
);

router
    .route("/:id")
    .get(validate(productIdParamSchema), getProductById)
    .put(
        protect,
        authorize("seller", "admin"),
        validate(updateProductSchema),
        updateProduct
    )
    .delete(
        protect,
        authorize("seller", "admin"),
        validate(productIdParamSchema),
        deleteProduct
    );

export default router;
