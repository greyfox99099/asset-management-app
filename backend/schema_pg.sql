-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff',
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    sub_category VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(50),
    location VARCHAR(100),
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Available',
    purchase_date DATE,
    purchase_price DECIMAL(15, 2),
    date_of_use DATE,
    expected_life_years INTEGER,
    depreciation_annual DECIMAL(15, 2),
    depreciation_monthly DECIMAL(15, 2),
    current_value DECIMAL(15, 2),
    supplier VARCHAR(255),
    last_calibrated_date DATE,
    next_calibration_date DATE,
    warranty_expiry_date DATE,
    maintenance_schedule VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset Attachments Table
CREATE TABLE IF NOT EXISTS asset_attachments (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset History Table (Optional, strictly standardizing on plural table names)
CREATE TABLE IF NOT EXISTS asset_history (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by INTEGER REFERENCES users(id),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
