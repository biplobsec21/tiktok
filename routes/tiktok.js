import express from "express";
import Tiktok from "@xct007/tiktok-scraper";
import rateLimit from "express-rate-limit";

const router = express.Router();

// 1. Specific Rate Limiter for TikTok (Stricter: 50 req / 15 min)
const tiktokLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: "Too many TikTok requests. Please wait." }
});

router.use(tiktokLimiter);

// Helper for delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Load Session from ENV (Passed from main app or loaded here via process.env)
const sessionList = [`sessionid=${process.env.TIKTOK_SESSION_ID}`];
const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    // ... add your other headers here
};

// GET /api/tiktok?url=...
router.get("/", async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: "Missing 'url' parameter" });
        if (!/tiktok\.com/.test(url)) return res.status(400).json({ error: "Invalid TikTok URL" });

        let attempts = 0;
        let data = null;

        // Retry Loop
        while (attempts < 3) {
            try {
                attempts++;
                data = await Tiktok(url, { parse: false, sessionList, headers: defaultHeaders });
                if (data) break;
            } catch (err) {
                console.warn(`[TikTok] Attempt ${attempts} failed: ${err.message}`);
                if (attempts === 3) break;
                await delay(1500);
            }
        }

        if (!data) return res.status(500).json({ error: "Failed to fetch TikTok data" });

        // Normalize
        const targetPost = Array.isArray(data) ? data[0] : data;
        if (!targetPost?.video) return res.status(422).json({ error: "Video data not found" });

        return res.json({
            success: true,
            provider: "TikTok",
            data: {
                desc: targetPost.desc,
                urlList: targetPost.video.play_addr?.url_list || [],
                photo: targetPost.video.cover?.url_list || []
            }
        });

    } catch (error) {
        console.error("[TikTok] Critical Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
