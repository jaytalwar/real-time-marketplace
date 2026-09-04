import { z } from "zod";

const objectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const createProductSchema = {
    body: z.object({
        title: z.string().trim().min(1, "Title is required").max(200),
        description: z.string().trim().min(1, "Description is required").max(4000),
        price: z.coerce.number().nonnegative("Price cannot be negative"),
        category: z.string().trim().min(1, "Category is required").max(100),
        image: z.string().trim().url("Image must be a valid URL").or(z.literal("")).optional(),
        stock: z.coerce.number().int().nonnegative("Stock cannot be negative").default(0),
    }),
};

export const updateProductSchema = {
    body: createProductSchema.body.partial(),
    params: z.object({ id: objectId }),
};

export const productIdParamSchema = {
    params: z.object({ id: objectId }),
};

export const listProductsSchema = {
    query: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        sort: z.string().optional(),
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        minPrice: z.coerce.number().nonnegative().optional(),
        maxPrice: z.coerce.number().nonnegative().optional(),
    }),
};

export const createOrderSchema = {
    body: z.object({
        items: z
            .array(
                z.object({
                    product: objectId,
                    quantity: z.coerce.number().int().positive().default(1),
                })
            )
            .min(1, "Order must contain at least one item"),
    }),
};

export const updateOrderStatusSchema = {
    params: z.object({ id: objectId }),
    body: z.object({
        status: z.enum([
            "Pending",
            "Packed",
            "Shipped",
            "Out for Delivery",
            "Delivered",
        ]),
    }),
};
