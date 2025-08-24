import express from "express";
import Tiktok from "@xct007/tiktok-scraper";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Optional: fallback proxy for VPS IPs (⚠️ free proxy, rate-limited)
const fallbackProxy = "https://cors-anywhere.herokuapp.com/";

// -------------------------------
// Test route
// -------------------------------
app.get("/", (req, res) => {
    res.json({ message: "TikTok API is running!" });
});

// -------------------------------
// TikTok download endpoint
// -------------------------------
app.get("/api/tiktok", async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: "TikTok URL is required" });
    }

    const requestOptions = {
        parse: false,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
            "Referer": "https://www.tiktok.com/",
            "Accept-Language": "en-US,en;q=0.9",
        },
    };

    // Try direct request first
    try {
        let data = await Tiktok(url, requestOptions);

        if (!data || data.length === 0 || !data[0].video) {
            throw new Error("No video data found");
        }

        const videoData = data[0].video;
        return res.json({
            urlList: videoData.play_addr?.url_list || [],
            photo: videoData.cover?.url_list || [],
        });

    } catch (directError) {
        console.warn("Direct request failed, trying proxy fallback:", directError.message);

        try {
            const proxiedUrl = fallbackProxy + url;
            let data = await Tiktok(proxiedUrl, requestOptions);

            if (!data || data.length === 0 || !data[0].video) {
                throw new Error("No video data found even via proxy");
            }

            const videoData = data[0].video;
            return res.json({
                urlList: videoData.play_addr?.url_list || [],
                photo: videoData.cover?.url_list || [],
                info: "Fetched via fallback proxy",
            });

        } catch (proxyError) {
            console.error("Proxy fallback also failed:", proxyError.message);
            return res.status(500).json({ error: "Failed to fetch TikTok data", details: proxyError.message });
        }
    }
});

app.listen(PORT, () => {
    console.log(`TikTok API server running on http://localhost:${PORT}`);
});
