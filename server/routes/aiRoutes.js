import express from "express";

import {
    generateProductDescription,
    chatWithAssistant,
} from "../controllers/aiController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
    "/generate-description",
    protect,
    authorize("seller", "admin"),
    generateProductDescription
);

router.post("/assistant", chatWithAssistant);

export default router;
