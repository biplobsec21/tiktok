import express from "express";
import Tiktok from "@xct007/tiktok-scraper";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Use your session cookies from TikTok
const sessionList = [
    "sessionid=3a73194b88f5e167722e251321ec63ee",
    "sid_tt=3a73194b88f5e167722e251321ec63ee",
    "sid_ucp_v1=1.0.0-KDBkYWM0ZGQyMjBmZTYyOGUwYWFjOGFhNTMyYjA4N2E5ZjM3Y2ZmODAKGQiSiNq8x9uMzWgQjeboxAYYsws4CEASSAQQAxoCbXkiIDNhNzMxOTRiODhmNWUxNjc3MjJlMjUxMzIxZWM2M2Vl"
];

// Simple test route to verify server is running
app.get("/", (req, res) => {
    res.json({ message: "TikTok API is running" });
});

// TikTok scraping endpoint
app.get("/api/tiktok", async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: "TikTok URL is required" });
        }

        // Scrape TikTok using session cookies
        const data = await Tiktok(url, {
            parse: false,
            sessionList,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
                "Referer": "https://www.tiktok.com/",
                "Accept-Language": "en-US,en;q=0.9",
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

app.listen(PORT, () => {
    console.log(`TikTok API server running on http://localhost:${PORT}`);
});
