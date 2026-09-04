import asyncHandler from "../utils/asyncHandler.js";
import * as productService from "../services/productService.js";
import * as pricingService from "../services/pricingService.js";
import * as recommendationService from "../services/recommendationService.js";

// @desc Create Product
// @route POST /api/products
// @access Seller
export const createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body, req.user._id);
    res.status(201).json(product);
});

// @desc Get All Products
// @route GET /api/products
// @access Public
export const getProducts = asyncHandler(async (req, res) => {
    const result = await productService.listProducts(req.query);
    res.set("X-Cache", result.cache);
    delete result.cache;
    res.json(result);
});

// @desc Get Product By Id
// @route GET /api/products/:id
// @access Public
export const getProductById = asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
});

// @desc Update Product
// @route PUT /api/products/:id
// @access Seller
export const updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body, req.user);
    res.json(product);
});

// @desc Get products belonging to the logged-in seller
// @route GET /api/products/my-products
// @access Seller
export const getMyProducts = asyncHandler(async (req, res) => {
    const products = await productService.getMyProducts(req.user._id);
    res.json(products);
});

// @desc Delete Product
// @route DELETE /api/products/:id
// @access Seller
export const deleteProduct = asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id, req.user);
    res.json({ message: "Product deleted successfully" });
});

// @desc Explainable, rule-based pricing suggestion for the product's owner
// @route GET /api/products/:id/pricing-insight
// @access Seller (owner) / Admin
export const getPricingInsight = asyncHandler(async (req, res) => {
    const insight = await pricingService.getPricingInsight(req.params.id, req.user);
    res.json(insight);
});

// @desc Related products (co-purchase + category), ranked, out-of-stock excluded
// @route GET /api/products/:id/recommendations
// @access Public
export const getRecommendations = asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 6;
    const recommendations = await recommendationService.getRecommendations(req.params.id, limit);
    res.json(
        recommendations.map(({ product, reason }) => ({
            ...product.toObject(),
            recommendationReason: reason,
        }))
    );
});
