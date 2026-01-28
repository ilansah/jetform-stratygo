const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Essential for running schema.sql
};

async function initDb() {
    let connection;
    try {
        // Connect without database first to create it if needed
        connection = await mysql.createConnection(dbConfig);
        const dbName = process.env.DB_NAME || 'stratygo_fiber';

        console.log(`Creating database ${dbName} if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        await connection.query(`USE ${dbName}`);

        console.log('Reading schema.sql...');
        const schemaPath = path.join(__dirname, '../schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        await connection.query(schema);

        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        if (connection) await connection.end();
    }
}

initDb();
