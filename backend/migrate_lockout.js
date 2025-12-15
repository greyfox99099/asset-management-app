const { query } = require('./db');

async function addAccountLockoutColumns() {
    try {
        console.log('Adding account lockout columns to users table...');

        const migrations = [
            {
                name: 'Add failed_login_attempts column',
                sql: `ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0`
            },
            {
                name: 'Add locked_until column',
                sql: `ALTER TABLE users ADD COLUMN locked_until DATETIME`
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

        console.log('Account lockout columns migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addAccountLockoutColumns();
