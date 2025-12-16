const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to database
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'asset_management.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS asset_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_type TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE
);
`;

const migrateDataQuery = `
INSERT INTO asset_attachments (asset_id, file_url, file_name, file_type)
SELECT id, photo_url, 'Initial Photo', 'image/jpeg' 
FROM assets 
WHERE photo_url IS NOT NULL AND photo_url != '';
`;

const migrateDocQuery = `
INSERT INTO asset_attachments (asset_id, file_url, file_name, file_type)
SELECT id, document_url, 'Initial Document', 'application/pdf' 
FROM assets 
WHERE document_url IS NOT NULL AND document_url != '';
`;

db.serialize(() => {
    // 1. Create Table
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Table asset_attachments created successfully.');

            // 2. Migrate Photos
            db.run(migrateDataQuery, function (err) {
                if (err) {
                    console.error('Error migrating photos:', err.message);
                } else {
                    console.log(`Migrated ${this.changes} photos.`);
                }
            });

            // 3. Migrate Documents
            db.run(migrateDocQuery, function (err) {
                if (err) {
                    console.error('Error migrating documents:', err.message);
                } else {
                    console.log(`Migrated ${this.changes} documents.`);
                }
            });
        }
    });
});

// Close connection after a delay to ensure queries finish
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
}, 2000);
