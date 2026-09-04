import Product from "../models/Product.js";
import Order from "../models/Order.js";
import AppError from "../utils/AppError.js";

const RECENT_WINDOW_DAYS = 14;
const LOW_STOCK_THRESHOLD = 5;
const GLUT_STOCK_THRESHOLD = 50;
const MAX_TOTAL_ADJUSTMENT = 0.15;
const MIN_TOTAL_ADJUSTMENT = -0.1;

const recentWindowStart = () =>
    new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

/** Units of `productId` sold across all orders placed since `since`. */
const getRecentUnitsSold = async (productId, since) => {
    const result = await Order.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $unwind: "$items" },
        { $match: { "items.product": productId } },
        { $group: { _id: null, units: { $sum: "$items.quantity" } } },
    ]);

    return result[0]?.units || 0;
};

/**
 * A seller's own recent per-product sales velocity, used as the baseline a
 * single product's velocity is compared against (avoids leaning on a
 * marketplace-wide average that would be skewed by unrelated categories).
 */
const getSellerAverageRecentUnits = async (sellerId, since) => {
    const productIds = await Product.find({ seller: sellerId }).distinct("_id");
    if (productIds.length === 0) return 0;

    const sold = await Order.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $unwind: "$items" },
        { $match: { "items.product": { $in: productIds } } },
        { $group: { _id: "$items.product", units: { $sum: "$items.quantity" } } },
    ]);

    const soldByProduct = new Map(sold.map((row) => [row._id.toString(), row.units]));
    const totals = productIds.map((id) => soldByProduct.get(id.toString()) || 0);

    return totals.reduce((sum, n) => sum + n, 0) / totals.length;
};

const roundPrice = (price) => {
    if (price >= 500) return Math.round(price / 10) * 10;
    return Math.round(price);
};

/**
 * Explainable, rule-based pricing suggestion. Every driver here is computed
 * from this product's own real data (stock, recent order history relative
 * to the seller's own other products) — there is no competitor-price signal
 * because there is no real data source for one, and no ML model behind
 * this yet (see docs/ARCHITECTURE.md §7 for why, and what a trained model
 * would need before it could honestly replace this).
 */
export const getPricingInsight = async (productId, requester) => {
    const product = await Product.findById(productId);
    if (!product) throw new AppError("Product not found", 404);

    if (product.seller.toString() !== requester._id.toString() && requester.role !== "admin") {
        throw new AppError("Unauthorized", 403);
    }

    const since = recentWindowStart();
    const [recentUnitsSold, sellerAverageUnits] = await Promise.all([
        getRecentUnitsSold(product._id, since),
        getSellerAverageRecentUnits(product.seller, since),
    ]);

    const drivers = [];

    if (product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD) {
        drivers.push({
            signal: "low_inventory",
            direction: "up",
            adjustment: 0.08,
            label: "Low inventory",
            detail: `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} left — demand may be outpacing available stock.`,
        });
    } else if (product.stock >= GLUT_STOCK_THRESHOLD && recentUnitsSold === 0) {
        drivers.push({
            signal: "excess_inventory",
            direction: "down",
            adjustment: -0.06,
            label: "Excess inventory",
            detail: `${product.stock} units in stock with no sales in the last ${RECENT_WINDOW_DAYS} days — a lower price could help move stock.`,
        });
    }

    if (recentUnitsSold >= 2 && recentUnitsSold > sellerAverageUnits * 1.5) {
        drivers.push({
            signal: "high_demand",
            direction: "up",
            adjustment: 0.06,
            label: "Above-average demand",
            detail: `${recentUnitsSold} unit${recentUnitsSold === 1 ? "" : "s"} sold in the last ${RECENT_WINDOW_DAYS} days, well above your ${sellerAverageUnits.toFixed(1)}-unit average across your other listings.`,
        });
    } else if (recentUnitsSold === 0 && product.views > 20) {
        drivers.push({
            signal: "interest_without_conversion",
            direction: "down",
            adjustment: -0.04,
            label: "Views without purchases",
            detail: `${product.views} views but no sales in the last ${RECENT_WINDOW_DAYS} days — price may be a barrier to converting interest into sales.`,
        });
    }

    const totalAdjustment = Math.min(
        MAX_TOTAL_ADJUSTMENT,
        Math.max(MIN_TOTAL_ADJUSTMENT, drivers.reduce((sum, d) => sum + d.adjustment, 0))
    );

    const recommendedPrice =
        totalAdjustment === 0 ? product.price : roundPrice(product.price * (1 + totalAdjustment));

    return {
        productId: product._id,
        currentPrice: product.price,
        recommendedPrice,
        changePercent: Math.round(totalAdjustment * 1000) / 10,
        drivers,
        summary:
            drivers.length === 0
                ? "Current price looks well-aligned with demand and inventory signals — no change recommended."
                : `Based on ${drivers.length} signal${drivers.length === 1 ? "" : "s"} from your own sales and inventory data.`,
        basedOn: {
            windowDays: RECENT_WINDOW_DAYS,
            recentUnitsSold,
            sellerAverageUnits: Math.round(sellerAverageUnits * 10) / 10,
            stock: product.stock,
            views: product.views,
        },
    };
};
