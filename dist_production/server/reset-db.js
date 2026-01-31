const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function resetDatabase() {
    try {
        // Connect to MySQL
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'stratygo_fiber'
        });

        console.log('Connected to MySQL');

        // Drop the table if it exists
        console.log('Dropping table accreditations if exists...');
        await connection.query('DROP TABLE IF EXISTS accreditations');
        console.log('Table dropped successfully');

        // Read and execute schema
        const schemaPath = path.join(__dirname, '../schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Creating table from schema...');
        await connection.query(schema);
        console.log('Table created successfully!');

        await connection.end();
        console.log('Database reset complete!');
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}

resetDatabase();
