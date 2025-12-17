const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('./authMiddleware');
const authRoutes = require('./authRoutes');
const reportRoutes = require('./reportRoutes');
const userRoutes = require('./userRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Keep-Alive Endpoint for Replit (Top Priority)
// Bypasses all middleware to ensure instant response during wake-up
app.get('/', (req, res) => {
    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    console.log(`Ping Received at ${new Date().toISOString()}`);
    res.status(200).send('Server is running.');
});

// Trust proxy (required for Replit/Render/Vercel)
app.set('trust proxy', 1);

// Security Middleware
// 1. Helmet - Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        }
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for QR codes
}));

// 2. CORS - Allow both localhost and network IP
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://192.168.18.32:5173',
    'http://192.168.18.32:5174',
    process.env.FRONTEND_URL
].filter(Boolean);

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 3. Rate Limiting - General API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false } // Disable validation for Replit/Proxy
});

// 4. Strict Rate Limiting for Auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }, // Disable validation for Replit/Proxy
    skipSuccessfulRequests: true, // Don't count successful logins
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour
    message: 'Too many accounts created from this IP, please try again later',
});

// Apply rate limiting
app.use('/api/', apiLimiter);

// Configure Multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit request size
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Auth Routes (public) with rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', authRoutes);

// Report Routes (protected)
app.use('/api/reports', authMiddleware, reportRoutes);

// User Management Routes (admin only - middleware inside router)
app.use('/api/users', authMiddleware, userRoutes);

// Asset Routes (protected) - now handles multi-file upload
const assetRoutes = require('./assetRoutes');
app.use('/api/assets', authMiddleware, assetRoutes); // Mount at /api/assets

// Public view (updated to support attachments logic if needed, but keeping simple for now)
app.get('/api/public/assets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM assets WHERE id = ?', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        // Return asset data
        const asset = result.rows[0];

        // Fetch attachments for public view too (optional, but good for completeness)
        const attachments = await pool.query('SELECT * FROM asset_attachments WHERE asset_id = ?', [id]);

        const publicData = {
            ...asset,
            attachments: attachments.rows
            // keeping all fields for public view simplified
        };

        res.json(publicData);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});



// Start server - Listen on all network interfaces for mobile access
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://192.168.18.32:${PORT}`);
});
