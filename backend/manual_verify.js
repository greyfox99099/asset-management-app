const { query } = require('./db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const email = process.argv[2];

if (!email) {
    console.log('Usage: node manual_verify.js <email>');
    process.exit(1);
}

(async () => {
    try {
        console.log(`Verifying user: ${email}...`);

        // Check if user exists
        const check = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (check.rows.length === 0) {
            console.log('Error: User not found!');
            process.exit(1);
        }

        // Update verify status
        await query('UPDATE users SET email_verified = 1, locked_until = NULL, failed_login_attempts = 0 WHERE email = ?', [email]);
        console.log('✅ SUCCESS! User verified manually.');
        console.log('You can now login at the frontend.');

    } catch (err) {
        console.error('Error:', err.message);
    }
})();
