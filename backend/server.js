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

// Public asset view (no authentication required)
app.get('/api/public/assets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM assets WHERE id = ?', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        // Return asset data without financial information
        const asset = result.rows[0];
        const publicData = {
            id: asset.id,
            asset_id: asset.asset_id,
            name: asset.name,
            description: asset.description,
            category: asset.category,
            sub_category: asset.sub_category,
            quantity: asset.quantity,
            unit: asset.unit,
            location: asset.location,
            department: asset.department,
            status: asset.status,
            purchase_date: asset.purchase_date,
            date_of_use: asset.date_of_use,
            expected_life_years: asset.expected_life_years,
            last_calibrated_date: asset.last_calibrated_date,
            next_calibration_date: asset.next_calibration_date,
            warranty_expiry_date: asset.warranty_expiry_date,
            photo_url: asset.photo_url,
            document_url: asset.document_url
            // Exclude: purchase_price, depreciation_annual, depreciation_monthly
        };

        res.json(publicData);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Protected Routes

// Get all assets
app.get('/api/assets', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM assets ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get single asset
app.get('/api/assets/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM assets WHERE id = ?', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create asset
app.post('/api/assets', authMiddleware, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'document', maxCount: 1 }]), async (req, res) => {
    try {
        console.log('Received body:', req.body);
        const {
            asset_id, name, description, quantity, unit, location, department,
            category, sub_category, purchase_date, date_of_use, status,
            purchase_price, expected_life_years, depreciation_annual,
            depreciation_monthly, last_calibrated_date, next_calibration_date,
            warranty_expiry_date
        } = req.body;

        const photo_url = req.files['photo'] ? `/uploads/${req.files['photo'][0].filename}` : null;
        const document_url = req.files['document'] ? `/uploads/${req.files['document'][0].filename}` : null;

        const result = await pool.query(
            `INSERT INTO assets (
                asset_id, name, description, quantity, unit, location, department, 
                category, sub_category, purchase_date, date_of_use, status, 
                purchase_price, expected_life_years, depreciation_annual, 
                depreciation_monthly, last_calibrated_date, next_calibration_date, 
                warranty_expiry_date, photo_url, document_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
            [
                asset_id, name, description, quantity, unit, location, department,
                category, sub_category, purchase_date, date_of_use, status,
                purchase_price, expected_life_years, depreciation_annual,
                depreciation_monthly, last_calibrated_date, next_calibration_date,
                warranty_expiry_date, photo_url, document_url
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update asset
app.put('/api/assets/:id', authMiddleware, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'document', maxCount: 1 }]), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            asset_id, name, description, quantity, unit, location, department,
            category, sub_category, purchase_date, date_of_use, status,
            purchase_price, expected_life_years, depreciation_annual,
            depreciation_monthly, last_calibrated_date, next_calibration_date,
            warranty_expiry_date
        } = req.body;

        // Fetch existing asset to keep old URLs if no new file is uploaded
        const existing = await pool.query('SELECT photo_url, document_url FROM assets WHERE id = ?', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ msg: 'Asset not found' });
        }

        const photo_url = req.files['photo'] ? `/uploads/${req.files['photo'][0].filename}` : existing.rows[0].photo_url;
        const document_url = req.files['document'] ? `/uploads/${req.files['document'][0].filename}` : existing.rows[0].document_url;

        const result = await pool.query(
            `UPDATE assets SET 
                asset_id = ?, name = ?, description = ?, quantity = ?, unit = ?, location = ?, 
                department = ?, category = ?, sub_category = ?, purchase_date = ?, 
                date_of_use = ?, status = ?, purchase_price = ?, expected_life_years = ?, 
                depreciation_annual = ?, depreciation_monthly = ?, last_calibrated_date = ?, 
                next_calibration_date = ?, warranty_expiry_date = ?, photo_url = ?, 
                document_url = ? 
            WHERE id = ? RETURNING *`,
            [
                asset_id, name, description, quantity, unit, location, department,
                category, sub_category, purchase_date, date_of_use, status,
                purchase_price, expected_life_years, depreciation_annual,
                depreciation_monthly, last_calibrated_date, next_calibration_date,
                warranty_expiry_date, photo_url, document_url, id
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete asset
app.delete('/api/assets/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM assets WHERE id = ? RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        res.json({ msg: 'Asset deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Start server - Listen on all network interfaces for mobile access
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://192.168.18.32:${PORT}`);
});
