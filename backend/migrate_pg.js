const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

const migrate = async () => {
    try {
        console.log('Starting migration...');
        const schema = fs.readFileSync(path.join(__dirname, 'schema_pg.sql'), 'utf8');

        // Execute the entire schema file
        await pool.query(schema);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
