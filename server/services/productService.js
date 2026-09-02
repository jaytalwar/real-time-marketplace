import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";
import {
    buildProductListCacheKey,
    getCachedProductList,
    setCachedProductList,
    getCachedProduct,
    setCachedProduct,
    invalidateProduct,
    bumpProductListVersion,
} from "./cacheService.js";

export const listProducts = async (query) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = query.sort || "-createdAt";

    const cacheKey = await buildProductListCacheKey({
        page,
        limit,
        sort,
        search: query.search || "",
        category: query.category || "",
        minPrice: query.minPrice || "",
        maxPrice: query.maxPrice || "",
    });

    const cached = await getCachedProductList(cacheKey);
    if (cached) return { ...cached, cache: "hit" };

    const filter = {};

    if (query.search) {
        filter.title = { $regex: query.search, $options: "i" };
    }

    if (query.category) {
        filter.category = query.category;
    }

    if (query.minPrice || query.maxPrice) {
        filter.price = {};
        if (query.minPrice) filter.price.$gte = Number(query.minPrice);
        if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
    }

    const [products, totalProducts] = await Promise.all([
        Product.find(filter)
            .skip(skip)
            .limit(limit)
            .populate("seller", "name email")
            .sort(sort),
        Product.countDocuments(filter),
    ]);

    const result = {
        products,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
    };

    await setCachedProductList(cacheKey, result);

    return { ...result, cache: "miss" };
};

export const getProductById = async (id) => {
    const cached = await getCachedProduct(id);

    if (cached) {
        // Views are eventually-consistent while served from cache: the DB
        // count below is still incremented on every request, but the number
        // returned here can lag by up to the cache TTL. This trades count
        // precision for not doing a write on every single product-page view.
        Product.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
        return cached;
    }

    const product = await Product.findById(id).populate("seller", "name email");
    if (!product) throw new AppError("Product not found", 404);

    product.views += 1;
    await product.save();

    await setCachedProduct(id, product);

    return product;
};

export const createProduct = (data, sellerId) =>
    Product.create({ ...data, seller: sellerId }).then(async (product) => {
        await bumpProductListVersion();
        return product;
    });

export const getMyProducts = (sellerId) =>
    Product.find({ seller: sellerId }).sort({ createdAt: -1 });

export const updateProduct = async (id, data, requester) => {
    const product = await Product.findById(id);
    if (!product) throw new AppError("Product not found", 404);

    if (product.seller.toString() !== requester._id.toString() && requester.role !== "admin") {
        throw new AppError("Unauthorized", 403);
    }

    Object.assign(product, data);
    await product.save();

    await Promise.all([invalidateProduct(id), bumpProductListVersion()]);

    return product;
};

export const deleteProduct = async (id, requester) => {
    const product = await Product.findById(id);
    if (!product) throw new AppError("Product not found", 404);

    if (product.seller.toString() !== requester._id.toString() && requester.role !== "admin") {
        throw new AppError("Unauthorized", 403);
    }

    await product.deleteOne();
    await Promise.all([invalidateProduct(id), bumpProductListVersion()]);
};
