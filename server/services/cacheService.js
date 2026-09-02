import redis from "../config/redis.js";

const PRODUCT_LIST_TTL_SECONDS = 60;
const PRODUCT_DETAIL_TTL_SECONDS = 300;
const VERSION_KEY = "products:version";

const safe = async (fn, fallback) => {
    try {
        return await fn();
    } catch (err) {
        console.error("Redis error (falling back to DB):", err.message);
        return fallback;
    }
};

const getProductListVersion = () =>
    safe(async () => {
        const version = await redis.get(VERSION_KEY);
        return version || "1";
    }, "1");

export const bumpProductListVersion = () =>
    safe(() => redis.incr(VERSION_KEY), null);

export const buildProductListCacheKey = async (query) => {
    const version = await getProductListVersion();
    const normalized = Object.keys(query)
        .sort()
        .map((key) => `${key}=${query[key] ?? ""}`)
        .join("&");
    return `products:v${version}:${normalized}`;
};

export const getCachedProductList = (key) =>
    safe(async () => {
        const raw = await redis.get(key);
        return raw ? JSON.parse(raw) : null;
    }, null);

export const setCachedProductList = (key, value) =>
    safe(
        () => redis.set(key, JSON.stringify(value), "EX", PRODUCT_LIST_TTL_SECONDS),
        null
    );

const productDetailKey = (id) => `product:${id}`;

export const getCachedProduct = (id) =>
    safe(async () => {
        const raw = await redis.get(productDetailKey(id));
        return raw ? JSON.parse(raw) : null;
    }, null);

export const setCachedProduct = (id, value) =>
    safe(
        () => redis.set(productDetailKey(id), JSON.stringify(value), "EX", PRODUCT_DETAIL_TTL_SECONDS),
        null
    );

export const invalidateProduct = (id) =>
    safe(() => redis.del(productDetailKey(id)), null);
