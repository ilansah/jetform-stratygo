const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function updateSchema() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        console.log('Adding contract_type column...');
        try {
            await connection.query("ALTER TABLE accreditations ADD COLUMN contract_type VARCHAR(50) AFTER role");
            console.log('Column contract_type added.');
        } catch (err) {
            console.log('Column contract_type likely exists or error:', err.message);
        }

        console.log('Schema update complete.');

    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        if (connection) await connection.end();
    }
}

updateSchema();
