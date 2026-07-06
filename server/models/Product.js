import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
        },

        price: {
            type: Number,
            required: true,
        },

        category: {
            type: String,
            required: true,
        },

        image: {
            type: String,
            default: "",
        },

        stock: {
            type: Number,
            default: 0,
        },

        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        views: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Product", productSchema);