const { query } = require('./db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

(async () => {
    try {
        console.log('Migrating database to add "role" column...');

        // Check if column exists
        try {
            await query('SELECT role FROM users LIMIT 1');
            console.log('Role column already exists. Skipping...');
        } catch (err) {
            // Column likely doesn't exist
            console.log('Adding role column...');
            await query("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'staff'");
            console.log('Role column added.');
        }

        // Set default role for existing users
        await query("UPDATE users SET role = 'staff' WHERE role IS NULL");

        // Update specific user to admin (Change 'admin' to your username if different)
        // You can run this script with a username argument: node migrate_role.js myusername
        const targetAdmin = process.argv[2] || 'admin';
        console.log(`Promoting user '${targetAdmin}' to admin...`);

        await query("UPDATE users SET role = 'admin' WHERE username = ? OR email = ?", [targetAdmin, targetAdmin]);

        console.log('Migration complete!');

    } catch (err) {
        console.error('Migration error:', err.message);
    }
})();
