const { initDB, query } = require('./db');
const fs = require('fs');
const path = require('path');

const run = async () => {
    try {
        console.log('Initializing Database...');
        await initDB();

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Firebird doesn't support multiple statements in one query call usually.
        // But for DDL, we often run one by one.
        // Assuming schema.sql has one create table statement for now.
        // We'll split by ';' just in case.

        const statements = schemaSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const sql of statements) {
            try {
                console.log('Executing:', sql.substring(0, 50) + '...');
                await query(sql);
            } catch (err) {
                if (err.message.includes('already exists')) {
                    console.log('Table likely already exists, skipping creation.');
                } else {
                    console.error('Error executing query:', err.message);
                    // Don't throw, try next statement
                }
            }
        }

        console.log('Database initialized successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Initialization failed:', err);
        process.exit(1);
    }
};

run();
