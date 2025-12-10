import express from "express";
import Tiktok from "@xct007/tiktok-scraper";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit"; // 1. Import Rate Limit

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Trust Proxy (Crucial for Rate Limiting on cloud hosting like Heroku/Render/AWS)
app.set('trust proxy', 1);

app.use(express.json());

// 3. Configure Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 50 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 429,
        error: "Too many requests*. Please try again later."
    }
});

// Apply rate limiter specifically to API routes
app.use("/api/", apiLimiter);

// Helper function to wait (for retries)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sessionList = [
    `sessionid=${process.env.TIKTOK_SESSION_ID}`,
];

const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9,bn;q=0.8",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "upgrade-insecure-requests": "1"
};

// Health Check
app.get("/", (req, res) => {
    res.json({
        status: "active",
        message: "TikTok Scraper API is running",
        timestamp: new Date().toISOString()
    });
});

// TikTok Scraping Route
app.get("/api/tiktok", async (req, res) => {
    try {
        const { url } = req.query;

        // Validation
        if (!url) {
            return res.status(400).json({ error: "Missing 'url' query parameter" });
        }

        const tiktokRegex = /tiktok\.com/;
        if (!tiktokRegex.test(url)) {
            return res.status(400).json({ error: "Invalid URL provided. Must be a tiktok.com URL." });
        }

        console.log(`[INFO] Scraping URL: ${url}`);

        // 4. RETRY LOGIC START
        // We try 3 times before giving up
        let attempts = 0;
        const maxAttempts = 3;
        let data = null;
        let lastError = null;

        while (attempts < maxAttempts) {
            try {
                attempts++;

                // Call the Scraper
                data = await Tiktok(url, {
                    parse: false,
                    sessionList,
                    headers: defaultHeaders
                });

                // If successful, break the loop immediately
                if (data) break;

            } catch (err) {
                lastError = err;
                console.warn(`[Attempt ${attempts}] Failed: ${err.message}`);

                // If this was the last attempt, don't wait, just let it fail
                if (attempts === maxAttempts) break;

                // Wait 1.5 seconds before trying again (helps with 429s)
                await delay(1500);
            }
        }
        // RETRY LOGIC END

        // 5. Check if data was actually found after retries
        if (!data) {
            const errorMessage = lastError ? lastError.message : "No data returned";
            return res.status(500).json({
                error: "Failed to fetch TikTok data after multiple attempts",
                details: errorMessage
            });
        }

        // Normalize data logic (from your previous code)
        let targetPost;
        if (Array.isArray(data) && data.length > 0) {
            targetPost = data[0];
        } else if (typeof data === 'object') {
            targetPost = data;
        }

        if (!targetPost || !targetPost.video) {
            console.warn("[WARN] Unexpected data structure:", JSON.stringify(data).substring(0, 200));
            return res.status(422).json({ error: "Could not extract video data from response" });
        }

        const videoData = targetPost.video;
        const urlList = videoData.play_addr?.url_list || [];
        const photo = videoData.cover?.url_list || [];

        return res.json({
            success: true,
            data: {
                id: targetPost.id,
                desc: targetPost.desc,
                urlList,
                photo
            }
        });

    } catch (error) {
        console.error("[ERROR] Critical failure:", error.message);
        return res.status(500).json({
            error: "Internal Server Error",
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
