const { query } = require('./db');

async function migrateDatabase() {
    try {
        console.log('Starting database migration...');

        // Check if columns exist, if not add them
        const migrations = [
            {
                name: 'Add email_verified column',
                sql: `ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0`
            },
            {
                name: 'Add verification_token column',
                sql: `ALTER TABLE users ADD COLUMN verification_token TEXT`
            },
            {
                name: 'Add verification_token_expires column',
                sql: `ALTER TABLE users ADD COLUMN verification_token_expires DATETIME`
            }
        ];

        for (const migration of migrations) {
            try {
                await query(migration.sql);
                console.log(`✓ ${migration.name}`);
            } catch (error) {
                if (error.message.includes('duplicate column name')) {
                    console.log(`- ${migration.name} (already exists)`);
                } else {
                    console.error(`✗ ${migration.name}:`, error.message);
                }
            }
        }

        console.log('Migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateDatabase();
