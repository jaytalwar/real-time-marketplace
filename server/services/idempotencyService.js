import redis from "../config/redis.js";

const LOCK_TTL_SECONDS = 30;
const RESULT_TTL_SECONDS = 60 * 60 * 24;
const ORDER_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const keyFor = (idempotencyKey) => `idempotency:order:${idempotencyKey}`;

/**
 * Returns { replay: true, orderId } if this key already has a completed order,
 * { replay: false } if this request acquired the lock and should proceed,
 * or throws an AppError(409) if another request with the same key is in flight.
 */
export const acquireIdempotencyLock = async (idempotencyKey) => {
    if (!idempotencyKey) return { replay: false };

    const key = keyFor(idempotencyKey);
    const existing = await redis.get(key);

    if (existing && ORDER_ID_PATTERN.test(existing)) {
        return { replay: true, orderId: existing };
    }

    const acquired = await redis.set(key, "pending", "EX", LOCK_TTL_SECONDS, "NX");

    if (!acquired) {
        const err = new Error("A request with this idempotency key is already being processed");
        err.statusCode = 409;
        err.isAppError = true;
        throw err;
    }

    return { replay: false };
};

export const completeIdempotencyLock = async (idempotencyKey, orderId) => {
    if (!idempotencyKey) return;
    await redis.set(keyFor(idempotencyKey), String(orderId), "EX", RESULT_TTL_SECONDS);
};

export const releaseIdempotencyLock = async (idempotencyKey) => {
    if (!idempotencyKey) return;
    await redis.del(keyFor(idempotencyKey));
};
