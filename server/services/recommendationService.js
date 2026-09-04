import Product from "../models/Product.js";
import Order from "../models/Order.js";

const CO_PURCHASE_WEIGHT = 10;
const VIEW_WEIGHT = 0.1;
const NEW_LISTING_BONUS = 2;
const NEW_LISTING_WINDOW_DAYS = 14;

/**
 * Candidate generation (co-purchase) -> ranking (weighted score) ->
 * business rules (own product excluded, out-of-stock excluded) -> final
 * list, with an honest `reason` per item so the frontend never claims more
 * than what the data actually shows.
 *
 * "Co-purchase" is computed as an in-memory adjacency count over real
 * Order.items — this is the MongoDB-native graph-query approach chosen in
 * docs/ARCHITECTURE.md §10 over standing up a dedicated graph database,
 * which isn't justified at this data scale.
 */
export const getRecommendations = async (productId, limit = 6) => {
    const source = await Product.findById(productId);
    if (!source) return [];

    const coPurchaseCounts = await getCoPurchaseCounts(productId);

    const candidateIds = new Set(coPurchaseCounts.keys());

    const categoryMatches = await Product.find({
        category: source.category,
        _id: { $ne: productId },
        stock: { $gt: 0 },
    })
        .select("_id")
        .limit(50);

    categoryMatches.forEach((p) => candidateIds.add(p._id.toString()));
    candidateIds.delete(productId.toString());

    if (candidateIds.size === 0) return [];

    const candidates = await Product.find({
        _id: { $in: [...candidateIds] },
        stock: { $gt: 0 },
    }).populate("seller", "name email");

    const now = Date.now();

    const ranked = candidates
        .map((product) => {
            const coCount = coPurchaseCounts.get(product._id.toString()) || 0;
            const isNewListing =
                now - new Date(product.createdAt).getTime() <
                NEW_LISTING_WINDOW_DAYS * 24 * 60 * 60 * 1000;

            const score =
                coCount * CO_PURCHASE_WEIGHT +
                (product.views || 0) * VIEW_WEIGHT +
                (isNewListing ? NEW_LISTING_BONUS : 0);

            return {
                product,
                score,
                reason: coCount > 0 ? "Frequently bought together" : "You might also like",
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return ranked;
};

const getCoPurchaseCounts = async (productId) => {
    const coOrders = await Order.find({ "items.product": productId }).select("items.product");

    const counts = new Map();

    for (const order of coOrders) {
        for (const item of order.items) {
            const id = item.product.toString();
            if (id === productId.toString()) continue;
            counts.set(id, (counts.get(id) || 0) + 1);
        }
    }

    return counts;
};
