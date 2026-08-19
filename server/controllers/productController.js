import Product from "../models/Product.js";
import redis from "../config/redis.js";

// @desc Create Product
// @route POST /api/products
// @access Seller
export const createProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            category,
            image,
            stock,
        } = req.body;

        const product = await Product.create({
            title,
            description,
            price,
            category,
            image,
            stock,
            seller: req.user._id,
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// @desc Get All Products
// @route GET /api/products
// @access Public
export const getProducts = async (req, res) => {

    try {

        const search = req.query.search || "";

        const category = req.query.category || "";

        const query = {};
        const page = Number(req.query.page) || 1;

const limit = Number(req.query.limit) || 10;

const skip = (page - 1) * limit;
const sort = req.query.sort || "-createdAt";

        if (search) {

            query.title = {
                $regex: search,
                $options: "i",
            };

        }

        if (category) {

            query.category = category;

        }

        const minPrice = req.query.minPrice;
        const maxPrice = req.query.maxPrice;

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const products = await Product.find(query)
.skip(skip)
.limit(limit)
            .populate("seller", "name email")
            .sort(sort);
            const totalProducts = await Product.countDocuments(query);


        res.json({

    products,

    currentPage: page,

    totalPages: Math.ceil(totalProducts / limit),

    totalProducts

});

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

// @desc Get Product By Id
// @route GET /api/products/:id
// @access Public
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate("seller", "name email");

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        product.views += 1;
        await product.save();
        

await redis.flushdb();

        res.json(product);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// @desc Update Product
// @route PUT /api/products/:id
// @access Seller
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }

        Object.assign(product, req.body);

        await product.save();

        res.json(product);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
export const getMyProducts = async (req, res) => {
    try {

        const products = await Product.find({
            seller: req.user._id,
        }).sort({
            createdAt: -1,
        });

        res.json(products);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

// @desc Delete Product
// @route DELETE /api/products/:id
// @access Seller
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }

        await product.deleteOne();
        await redis.flushdb();

        res.json({
            message: "Product deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};