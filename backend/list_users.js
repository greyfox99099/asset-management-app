const { query } = require('./db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

(async () => {
    try {
        console.log('Fetching all registered users...');
        console.log('----------------------------------------------------------------');
        console.log(String('ID').padEnd(5) + String('USERNAME').padEnd(20) + String('EMAIL').padEnd(30) + 'VERIFIED');
        console.log('----------------------------------------------------------------');

        const result = await query('SELECT id, username, email, email_verified, role FROM users');

        if (result.rows.length === 0) {
            console.log('No users found in database.');
        } else {
            result.rows.forEach(user => {
                console.log(
                    String(user.id).padEnd(5) +
                    String(user.username).padEnd(20) +
                    String(user.email).padEnd(30) +
                    (user.email_verified ? 'YES' : 'NO') +
                    (user.role ? ` (${user.role})` : '')
                );
            });
        }
        console.log('----------------------------------------------------------------');

    } catch (err) {
        console.error('Error:', err.message);
    }
})();
