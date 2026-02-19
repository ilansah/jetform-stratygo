const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'server/.env' }); // Adjust path if needed

async function checkPaths() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'stratygo_fiber'
    };

    try {
        const conn = await mysql.createConnection(config);
        const [rows] = await conn.execute('SELECT id, created_at, photo_path, id_card_front_path FROM accreditations ORDER BY created_at DESC LIMIT 5');
        console.log(JSON.stringify(rows, null, 2));
        await conn.end();
    } catch (e) {
        console.error(e);
    }
}

checkPaths();
