const { query } = require('./db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const identifier = process.argv[2];

if (!identifier) {
    console.log('Usage: node manual_verify.js <email_or_username>');
    process.exit(1);
}

(async () => {
    try {
        console.log(`Verifying user: ${identifier}...`);

        // Check if user exists
        const check = await query('SELECT * FROM users WHERE email = ? OR username = ?', [identifier, identifier]);
        if (check.rows.length === 0) {
            console.log('Error: User not found!');
            process.exit(1);
        }

        const user = check.rows[0];

        // Update verify status
        await query('UPDATE users SET email_verified = 1, locked_until = NULL, failed_login_attempts = 0 WHERE id = ?', [user.id]);
        console.log(`✅ SUCCESS! User '${user.username}' (${user.email}) verified manually.`);
        console.log('You can now login at the frontend.');

    } catch (err) {
        console.error('Error:', err.message);
    }
})();
