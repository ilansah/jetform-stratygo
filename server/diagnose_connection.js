const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testConnection(config, label) {
    console.log(`\nTesting ${label} configuration:`);
    console.log(`Host: ${config.host}, User: ${config.user}`);
    try {
        const conn = await mysql.createConnection(config);
        console.log('✅ SUCCESS! Connected.');
        await conn.end();
        return true;
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
        return false;
    }
}

async function diagnose() {
    console.log('--- Comprehensive Database Diagnostic ---');

    // 1. Test .env settings
    await testConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    }, 'CURRENT .ENV');

    // 2. Test Standard Local (XAMPP/WAMP default)
    await testConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
    }, 'Standard Local (No Password, e.g. XAMPP)');

    // 3. Test Standard Local (Root Password)
    await testConnection({
        host: '127.0.0.1',
        user: 'root',
        password: 'root',
    }, 'Standard Local (Root Password)');

    // 4. Test Standard Local (Just Hostname change)
    await testConnection({
        host: 'localhost',
        user: 'root',
        password: '',
    }, 'Localhost (No Password)');

    console.log('\n--- End of Diagnostic ---');
}

diagnose();
