const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

async function checkDatabase() {
    console.log('--- Database Diagnostic Tool ---');
    console.log(`Attempting connection to ${dbConfig.host}...`);

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connection Successful!');

        console.log(`Checking columns in table 'accreditations'...`);
        const [columns] = await connection.query("SHOW COLUMNS FROM accreditations");

        const columnNames = columns.map(c => c.Field);
        console.log('Current Columns:', columnNames.join(', '));

        const missingColumns = [];
        if (!columnNames.includes('contract_type')) missingColumns.push('contract_type');
        if (!columnNames.includes('type')) missingColumns.push('type');
        if (!columnNames.includes('signed_charte_path')) missingColumns.push('signed_charte_path');

        if (missingColumns.length > 0) {
            console.log('⚠️ MISSING COLUMNS FOUND:', missingColumns.join(', '));
            console.log('Attempting to fix...');

            if (missingColumns.includes('contract_type')) {
                try {
                    await connection.query("ALTER TABLE accreditations ADD COLUMN contract_type VARCHAR(50) AFTER role");
                    console.log('✅ Added column: contract_type');
                } catch (e) { console.error('Failed to add contract_type:', e.message); }
            }

            if (missingColumns.includes('type')) {
                try {
                    await connection.query("ALTER TABLE accreditations ADD COLUMN type ENUM('Fibre', 'Energie') DEFAULT 'Fibre' AFTER status");
                    console.log('✅ Added column: type');
                } catch (e) { console.error('Failed to add type:', e.message); }
            }

            if (missingColumns.includes('signed_charte_path')) {
                try {
                    await connection.query("ALTER TABLE accreditations ADD COLUMN signed_charte_path VARCHAR(255) AFTER signed_pdf_path");
                    console.log('✅ Added column: signed_charte_path');
                } catch (e) { console.error('Failed to add signed_charte_path:', e.message); }
            }

        } else {
            console.log('✅ All required columns appear to be present.');
        }

    } catch (error) {
        console.error('❌ CONNECTION FAILED:');
        console.error(error.message);
        console.log('\nPossible causes:');
        console.log('1. MySQL server is not running (Check XAMPP/WAMP or Services).');
        console.log('2. Credentials in .env are incorrect.');
        console.log('3. Port 3306 is blocked.');
    } finally {
        if (connection) await connection.end();
        console.log('--- End of Diagnostic ---');
    }
}

checkDatabase();
