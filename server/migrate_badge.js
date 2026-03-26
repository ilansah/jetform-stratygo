require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stratygo_fiber',
    multipleStatements: true
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Migrating badge column to TINYINT(4)...');
        await connection.query('ALTER TABLE accreditations MODIFY COLUMN badge TINYINT NOT NULL DEFAULT 0;');
        console.log('Migration successful.');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
