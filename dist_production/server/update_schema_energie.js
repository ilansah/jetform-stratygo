const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: (process.env.DB_HOST || 'localhost').trim(),
    user: (process.env.DB_USER || 'root').trim(),
    password: (process.env.DB_PASSWORD || '').trim(),
    database: (process.env.DB_NAME || 'stratygo_fiber').trim(),
    multipleStatements: true
};

console.log('DB Config:', { ...dbConfig, password: '***' });

async function updateSchema() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Add 'type' column
        try {
            await connection.query("ALTER TABLE accreditations ADD COLUMN type ENUM('Fibre', 'Energie') DEFAULT 'Fibre' AFTER status");
            console.log("Added column 'type'.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'type' already exists.");
            } else {
                throw err;
            }
        }

        // 2. Add 'signed_charte_path' column
        try {
            await connection.query("ALTER TABLE accreditations ADD COLUMN signed_charte_path VARCHAR(255) AFTER signed_pdf_path");
            console.log("Added column 'signed_charte_path'.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'signed_charte_path' already exists.");
            } else {
                throw err;
            }
        }

        console.log('Schema update complete.');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        if (connection) await connection.end();
    }
}

updateSchema();
