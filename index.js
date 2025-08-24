import express from "express";
import Tiktok from "@xct007/tiktok-scraper";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// TikTok session cookies and important headers
const sessionList = [
    "sessionid=3a73194b88f5e167722e251321ec63ee",
    "sid_tt=3a73194b88f5e167722e251321ec63ee",
    "sid_ucp_v1=1.0.0-KDBkYWM0ZGQyMjBmZTYyOGUwYWFjOGFhNTMyYjA4N2E5ZjM3Y2ZmODAKGQiSiNq8x9uMzWgQjeboxAYYsws4CEASSAQQAxoCbXkiIDNhNzMxOTRiODhmNWUxNjc3MjJlMjUxMzIxZWM2M2Vl",
    "ttwid=1%7C9GN_r2eTH7nDvp-Ehv-7HlTMr6VSVY1b3B6Ix6KFb0I%7C1756037233%7C32c9aca3840c94d54276f08e3eea013ca96e0e19a4617a2af1e7ac5693a0d1ac",
    "msToken=1fgeZL8A7IzRFfNIZragVZPKF3J5LPHlsKEiHuYe0GL4cGujlHIvxjqdTsMAnaf1bDLfufHWYzR4VRRpkEASVhXrDgS8THVWBMUURUzYDcQVtoUPImFfhDWYWAi3kT6tG6STORzT-oo1tT4g4YTlyk7M",
    "_ttp=2glaEg3zgC8NqCgQV41xHJ4clUx"
];

const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9,bn;q=0.8",
    "cache-control": "max-age=0",
    "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1"
};

// Simple health check route
app.get("/", (req, res) => {
    res.json({ message: "TikTok API is running" });
});

// TikTok scraping endpoint
app.get("/api/tiktok", async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: "TikTok URL is required" });

        const data = await Tiktok(url, {
            parse: false,
            sessionList,
            headers: defaultHeaders
        });

        if (!data || data.length === 0) return res.status(404).json({ error: "No data returned" });

        const videoData = data[0].video;
        if (!videoData) return res.status(404).json({ error: "No video data found" });

        const urlList = videoData.play_addr?.url_list || [];
        const photo = videoData.cover?.url_list || [];

        return res.json({ urlList, photo });
    } catch (error) {
        console.error("Error fetching TikTok data:", error);
        return res.status(500).json({ error: "Failed to fetch TikTok data" });
    }
});

app.listen(PORT, () => {
    console.log(`TikTok API server running on http://localhost:${PORT}`);
});
