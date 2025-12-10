import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import Routes
import tiktokRoutes from './routes/tiktok.js';
import facebookRoutes from './routes/facebook.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Global Middleware ---
app.use(helmet());          // Security Headers
app.use(cors());            // Allow Cross-Origin requests
app.use(morgan('dev'));     // Logging (Use 'dev' for readable logs, 'combined' for prod)
app.use(express.json());    // Parse JSON bodies

// --- Trust Proxy ---
// Required for rate limiting if behind Nginx/Heroku/Render
app.set('trust proxy', 1);

// --- Mount Routes ---
// Any request to /api/tiktok goes to the tiktok.js file
app.use('/api/tiktok', tiktokRoutes);

// Any request to /api/facebook goes to the facebook.js file
app.use('/api/facebook', facebookRoutes);

// --- Health Check ---
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        endpoints: {
            tiktok: 'GET /api/tiktok?url=...',
            facebook: 'GET /api/facebook?url=...',
            facebookBatch: 'POST /api/facebook/batch'
        }
    });
});

// --- 404 Handler ---
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`TikTok Endpoint:   http://localhost:${PORT}/api/tiktok`);
    console.log(`Facebook Endpoint: http://localhost:${PORT}/api/facebook`);
});
