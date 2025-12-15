const { query } = require('./db');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    try {
        console.log('Creating test user...');

        const username = 'admin';
        const email = 'admin@test.com';
        const password = 'admin123';

        // Check if user exists
        const existing = await query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.rows.length > 0) {
            console.log('User already exists. Updating to verified status...');
            await query(
                'UPDATE users SET email_verified = 1, failed_login_attempts = 0, locked_until = NULL WHERE username = ? OR email = ?',
                [username, email]
            );
            console.log('✓ User updated and verified!');
        } else {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Create user with verified email
            await query(
                'INSERT INTO users (username, email, password_hash, email_verified) VALUES (?, ?, ?, 1)',
                [username, email, password_hash]
            );
            console.log('✓ Test user created!');
        }

        console.log('\n=== Test User Credentials ===');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('Email: admin@test.com');
        console.log('Status: Email Verified ✓');
        console.log('============================\n');

        process.exit(0);
    } catch (error) {
        console.error('Error creating test user:', error);
        process.exit(1);
    }
}

createTestUser();
