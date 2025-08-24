import express from "express";
import Tiktok from "@xct007/tiktok-scraper";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// -------------------------------
// TikTok session cookies
// -------------------------------
const sessionList = [
    "__tea_session_id_1988=459a8aca-2302-46d3-927a-75a07b4e4434",
    "__tea_session_id_1992=07ec675b-cd44-4edd-bbe1-997bdb514e30",
    "__tea_session_id_345918=02a31ed7-33bd-406a-b434-d197512b1184",
    "__tea_session_id_548444=c33447cd-0258-4523-8171-f0e1f8b1cced",
    "__tea_session_id_594856=85166f8b-3243-4801-a28f-f8bafa55697c"
];

// -------------------------------
// Root route for testing
// -------------------------------
app.get("/", (req, res) => {
    res.json({ message: "TikTok API is running" });
});

// -------------------------------
// TikTok video download API
// -------------------------------
app.get("/api/tiktok", async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: "TikTok URL is required" });
        }

        const data = await Tiktok(url, {
            parse: false,
            sessionList, // Use your session cookies here
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
