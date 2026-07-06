import Product from "../models/Product.js";

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
        const products = await Product.find()
            .populate("seller", "name email")
            .sort({ createdAt: -1 });

        res.json(products);
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

        res.json({
            message: "Product deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};