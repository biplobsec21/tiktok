import express from "express";
import Tiktok from "@xct007/tiktok-scraper";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API endpoint: /api/tiktok?url=<tiktok_url>
app.get("/api/tiktok", async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: "TikTok URL is required" });
        }

        const data = await Tiktok(url, { parse: false });

        if (!data || data.length === 0) {
            return res.status(404).json({ error: "No data returned" });
        }

        const videoData = data[0].video;
        if (!videoData) {
            return res.status(404).json({ error: "No video data found" });
        }

        const urlList = videoData.play_addr?.url_list || [];
        const photo = videoData.cover?.url_list || [];

        return res.json({
            urlList,
            photo
        });

    } catch (error) {
        console.error("Error fetching TikTok data:", error);
        return res.status(500).json({ error: "Failed to fetch TikTok data" });
    }
});

app.listen(PORT, () => {
    console.log(`TikTok API server running on http://localhost:${PORT}`);
});
