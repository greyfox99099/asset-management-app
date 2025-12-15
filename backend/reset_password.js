const { query } = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
    console.log('Usage: node reset_password.js <username> <new_password>');
    process.exit(1);
}

(async () => {
    try {
        console.log(`Resetting password for user: ${username}...`);

        // Check if user exists
        const check = await query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
        if (check.rows.length === 0) {
            console.log('Error: User not found!');
            process.exit(1);
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await query('UPDATE users SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL WHERE username = ? OR email = ?',
            [passwordHash, username, username]
        );

        console.log('✅ SUCCESS! Password reset successfully.');
        console.log(`You can now login as '${username}' with the new password.`);

    } catch (err) {
        console.error('Error:', err.message);
    }
})();
