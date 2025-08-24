import express from "express";
import Tiktok from "@xct007/tiktok-scraper";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// -------------------------------
// Test route to check server status
// -------------------------------
app.get("/", (req, res) => {
    res.send("TikTok API server is running!");
});

// -------------------------------
// API endpoint: /api/tiktok?url=<tiktok_url>
// -------------------------------
app.get("/api/tiktok", async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: "TikTok URL is required" });
        }

        // Direct fetch without proxy
        const data = await Tiktok(url, {
            parse: false,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
                "Referer": "https://www.tiktok.com/",
                "Accept-Language": "en-US,en;q=0.9",
                "sec-ch-ua": '"Chromium";v="120", "Google Chrome";v="120"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"'
            },
        });

        if (!data || data.length === 0) {
            return res.status(404).json({ error: "No data returned" });
        }

        const videoData = data[0].video;
        if (!videoData) {
            return res.status(404).json({ error: "No video data found" });
        }

        const urlList = videoData.play_addr?.url_list || [];
        const photo = videoData.cover?.url_list || [];

        return res.json({ urlList, photo });

    } catch (error) {
        console.error("Error fetching TikTok data:", error.message);
        return res.status(500).json({ error: "Failed to fetch TikTok data" });
    }
});

// -------------------------------
// Start server
// -------------------------------
app.listen(PORT, () => {
    console.log(`TikTok API server running on http://localhost:${PORT}`);
});
