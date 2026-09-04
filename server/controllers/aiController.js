const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

const callClaude = async ({ system, messages, maxTokens = 400 }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        const err = new Error("AI assistant is not configured on this server");
        err.status = 503;
        throw err;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
        const response = await fetch(ANTHROPIC_URL, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: maxTokens,
                system,
                messages,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const text = await response.text();
            const err = new Error(`Anthropic API error: ${text}`);
            err.status = 502;
            throw err;
        }

        const data = await response.json();
        const text = data?.content?.find((block) => block.type === "text")?.text || "";
        return text;
    } finally {
        clearTimeout(timeout);
    }
};

const extractJson = (text) => {
    const cleaned = text
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
};

// @desc Generate an AI product description for sellers
// @route POST /api/ai/generate-description
// @access Seller
export const generateProductDescription = async (req, res) => {
    try {
        const { title, category } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        const text = await callClaude({
            maxTokens: 220,
            system:
                "You write concise, honest e-commerce product descriptions. " +
                "Write 2-3 short sentences (50-90 words total), no markdown, no emojis, no headings. " +
                "Focus on plausible, generic selling points for the given title and category. " +
                "Do not invent specific technical specifications, certifications, or brand claims you cannot know. " +
                "Respond with plain description text only, nothing else.",
            messages: [
                {
                    role: "user",
                    content: `Product title: ${title}\nCategory: ${category || "General"}`,
                },
            ],
        });

        res.json({ description: text.trim() });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

const ASSISTANT_SYSTEM = `You are Kartly's shopping assistant for an e-commerce marketplace.
Always reply with ONLY a single JSON object, no markdown fences, matching this shape:
{"reply": string, "filters": null | {"search"?: string, "category"?: string, "minPrice"?: number, "maxPrice"?: number, "sort"?: string}}

Rules:
- "reply" is a short, friendly, helpful message (1-3 sentences) shown directly to the shopper.
- Set "filters" only when the user is clearly looking for products to browse or buy. Otherwise set it to null.
- "filters.search" should be a short keyword (product name or type), not a full sentence.
- "filters.sort" must be one of: "-createdAt", "createdAt", "price", "-price", "-views" (omit if not relevant).
- Never claim to know real-time stock, exact prices, or specific product data yourself — the marketplace search will surface real results.
- Keep replies concise and never use markdown formatting.`;

const PRODUCT_QA_SYSTEM = `You are Kartly's shopping assistant helping a shopper with questions about ONE specific product.
Always reply with ONLY a single JSON object, no markdown fences, matching this shape:
{"reply": string, "filters": null}

Rules:
- Answer using ONLY the product details provided in the conversation context.
- If asked something the provided details don't cover, say honestly that the listing doesn't specify that.
- Keep the reply short (1-4 sentences), friendly, and never use markdown formatting.
- Always set "filters" to null.`;

// @desc AI shopping assistant (general search help or product Q&A)
// @route POST /api/ai/assistant
// @access Public
export const chatWithAssistant = async (req, res) => {
    try {
        const { message, history = [], productContext } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: "message is required" });
        }

        const contextPrefix = productContext
            ? `Product context (for this conversation only):\n${JSON.stringify(productContext)}\n\n`
            : "";

        const messages = [
            ...history
                .filter((m) => m && m.text)
                .slice(-8)
                .map((m) => ({
                    role: m.role === "assistant" ? "assistant" : "user",
                    content: m.text,
                })),
            {
                role: "user",
                content: `${contextPrefix}${message}`,
            },
        ];

        const text = await callClaude({
            system: productContext ? PRODUCT_QA_SYSTEM : ASSISTANT_SYSTEM,
            messages,
            maxTokens: 350,
        });

        const parsed = extractJson(text);

        if (!parsed || typeof parsed.reply !== "string") {
            return res.json({ reply: text.trim() || "I'm not sure how to help with that.", filters: null });
        }

        res.json({
            reply: parsed.reply,
            filters: productContext ? null : parsed.filters || null,
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
