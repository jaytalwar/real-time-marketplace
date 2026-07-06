import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req,res)=>{
    res.send("Marketplace API Running");
});

app.listen(process.env.PORT,()=>{
    console.log("Server Started");
});