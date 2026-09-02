import { ZodError } from "zod";
import AppError from "../utils/AppError.js";

export const notFound = (req, res, next) => {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (err, req, res, next) => {
    if (err instanceof ZodError) {
        return res.status(400).json({
            message: "Validation failed",
            errors: err.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    if (err.name === "CastError") {
        return res.status(400).json({ message: `Invalid id: ${err.value}` });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        return res.status(409).json({ message: `${field} already in use` });
    }

    const statusCode = err.isAppError ? err.statusCode : err.status || 500;

    if (!err.isAppError && statusCode >= 500) {
        console.error(err);
    }

    res.status(statusCode).json({
        message: err.isAppError || statusCode < 500
            ? err.message
            : "Something went wrong. Please try again.",
    });
};
