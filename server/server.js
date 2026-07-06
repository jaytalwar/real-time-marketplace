import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";


dotenv.config();

connectDB();

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);


app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.get("/", (req, res) => {
    res.send("Marketplace API Running");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});