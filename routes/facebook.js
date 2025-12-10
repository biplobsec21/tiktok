import express from 'express';
import rateLimit from 'express-rate-limit';
import getFbVideoInfo from '../utils/fbScraper.js'; // Import your new local file

const router = express.Router();

// 1. Specific Rate Limiter for Facebook
const fbLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many Facebook requests from this IP, please try again later.' }
});

router.use(fbLimiter);

// Helper: Validate URL
const isValidFacebookUrl = (url) => {
    const facebookPatterns = [
        /^https?:\/\/(www\.|m\.)?facebook\.com\/.*\/videos\/\d+/,
        /^https?:\/\/(www\.|m\.)?facebook\.com\/reel\/\d+/,
        /^https?:\/\/(www\.|m\.)?facebook\.com\/watch\/\?v=\d+/,
        /^https?:\/\/(www\.|m\.)?facebook\.com\/.*\/posts\/\d+/
    ];
    return facebookPatterns.some(pattern => pattern.test(url));
};

// GET /api/facebook?url=...
router.get('/', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) return res.status(400).json({ error: 'URL parameter is required' });
        if (!isValidFacebookUrl(url)) return res.status(400).json({ error: 'Invalid Facebook video URL format' });

        // Optional: Load cookie from env if you have one, otherwise use the default inside the util
        const cookie = process.env.FB_COOKIE || null;

        const videoInfo = await getFbVideoInfo(url, cookie);

        // Normalize response structure
        const response = {
            success: true,
            provider: 'Facebook',
            title: videoInfo.title || "Unknown Title",
            duration: videoInfo.duration_ms ? (videoInfo.duration_ms / 1000).toFixed(2) : null,
            thumbnail: videoInfo.thumbnail || null,
            downloadLinks: {
                sd: videoInfo.sd || null,
                hd: videoInfo.hd || null
            }
        };

        res.json(response);

    } catch (error) {
        console.error('[Facebook] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/facebook/batch
router.post('/batch', async (req, res) => {
    try {
        const { urls } = req.body;
        if (!Array.isArray(urls) || urls.length === 0) return res.status(400).json({ error: 'urls array is required' });
        if (urls.length > 10) return res.status(400).json({ error: 'Batch limit is 10 URLs' });

        const promises = urls.map(async (url, index) => {
            try {
                if (!isValidFacebookUrl(url)) throw new Error('Invalid URL format');
                const videoInfo = await getFbVideoInfo(url);
                return {
                    index, url, success: true,
                    data: { hd: videoInfo.hd, sd: videoInfo.sd, title: videoInfo.title }
                };
            } catch (error) {
                return { index, url, success: false, error: error.message };
            }
        });

        const results = await Promise.all(promises);
        res.json({
            success: true,
            total: results.length,
            results: results.sort((a, b) => a.index - b.index)
        });

    } catch (error) {
        res.status(500).json({ error: 'Batch processing failed' });
    }
});

export default router;
