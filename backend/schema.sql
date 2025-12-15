CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER,
    unit TEXT,
    location TEXT,
    department TEXT,
    category TEXT,
    sub_category TEXT,
    purchase_date DATE,
    date_of_use DATE,
    status TEXT DEFAULT 'In Storage',
    purchase_price DECIMAL(15, 2),
    expected_life_years INTEGER,
    depreciation_annual DECIMAL(15, 2),
    depreciation_monthly DECIMAL(15, 2),
    last_calibrated_date DATE,
    next_calibration_date DATE,
    warranty_expiry_date DATE,
    photo_url TEXT,
    document_url TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT 0,
    verification_token TEXT,
    verification_token_expires DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
