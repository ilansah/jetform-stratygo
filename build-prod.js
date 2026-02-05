const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = __dirname;
const CLIENT_DIR = path.join(PROJECT_ROOT, 'client');
const SERVER_DIR = path.join(PROJECT_ROOT, 'server');
const PROD_DIR = path.join(PROJECT_ROOT, 'dist_production');

console.log('🚀 Starting Production Build for Hostinger...');

try {
    // 1. Clean previous build
    if (fs.existsSync(PROD_DIR)) {
        console.log('🧹 Cleaning previous build...');
        fs.rmSync(PROD_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(PROD_DIR);

    // 2. Install Client Dependencies & Build React
    console.log('📦 Installing Client Dependencies...');
    execSync('npm install', { cwd: CLIENT_DIR, stdio: 'inherit' });

    console.log('⚛️  Building React App...');
    execSync('npm run build', { cwd: CLIENT_DIR, stdio: 'inherit' });

    // 3. Create Server Structure in Production Folder
    console.log('📂 Preparing Server Structure...');

    // Copy Server Files
    const destServerDir = path.join(PROD_DIR, 'server');
    fs.mkdirSync(destServerDir, { recursive: true });

    // Copy package.json from root (or server if separate, here we use root for simplicity or server one)
    // Actually, Hostinger usually expects one package.json in the root if we deploy the whole thing.
    // Let's copy the server package.json to the root of dist_production to act as the main one.
    fs.copyFileSync(path.join(PROJECT_ROOT, 'package.json'), path.join(PROD_DIR, 'package.json'));
    // Copy package-lock.json if it exists
    if (fs.existsSync(path.join(PROJECT_ROOT, 'package-lock.json'))) {
        fs.copyFileSync(path.join(PROJECT_ROOT, 'package-lock.json'), path.join(PROD_DIR, 'package-lock.json'));
    }

    // Copy server source code
    const serverFiles = fs.readdirSync(SERVER_DIR);
    serverFiles.forEach(file => {
        if (file !== 'node_modules' && file !== 'package.json' && file !== 'package-lock.json') {
            fs.copyFileSync(path.join(SERVER_DIR, file), path.join(destServerDir, file));
        }
    });

    // Copy needed root files (like schema.sql and index.js)
    if (fs.existsSync(path.join(PROJECT_ROOT, 'schema.sql'))) {
        fs.copyFileSync(path.join(PROJECT_ROOT, 'schema.sql'), path.join(PROD_DIR, 'schema.sql'));
    }
    if (fs.existsSync(path.join(PROJECT_ROOT, 'index.js'))) {
        fs.copyFileSync(path.join(PROJECT_ROOT, 'index.js'), path.join(PROD_DIR, 'index.js'));
    }

    // 4. Copy React Build to client/dist (so server.js finds it at ../client/dist)
    // server.js expects: path.join(__dirname, '../client/dist')
    // So inside PROD_DIR:
    //  - server/server.js
    //  - client/dist/index.html...
    const destClientDir = path.join(PROD_DIR, 'client');
    const destClientDist = path.join(destClientDir, 'dist');
    const destClientPublic = path.join(destClientDir, 'public'); // for documents if needed

    fs.mkdirSync(destClientDist, { recursive: true });

    // Copy built assets
    // Use recursive copy for directory
    const copyRecursive = (src, dest) => {
        if (fs.statSync(src).isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest);
            fs.readdirSync(src).forEach(child => {
                copyRecursive(path.join(src, child), path.join(dest, child));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    };

    copyRecursive(path.join(CLIENT_DIR, 'dist'), destClientDist);

    // Copy public documents (PDFs) that might be referenced directly
    // server.js expects: path.join(__dirname, '../client/public/documents')
    if (fs.existsSync(path.join(CLIENT_DIR, 'public', 'documents'))) {
        fs.mkdirSync(path.join(destClientPublic, 'documents'), { recursive: true });
        copyRecursive(path.join(CLIENT_DIR, 'public', 'documents'), path.join(destClientPublic, 'documents'));
    }

    // 5. Copy .env file from root
    console.log('📝 Copying .env from root...');
    if (fs.existsSync(path.join(PROJECT_ROOT, '.env'))) {
        fs.copyFileSync(path.join(PROJECT_ROOT, '.env'), path.join(PROD_DIR, '.env'));
    } else {
        console.warn('⚠️ No .env file found in root! Creating default one...');
        const envContent = `DB_HOST=127.0.0.1\nDB_USER=u548879916_stratygo59\nDB_PASSWORD=STRAT-jotform59\nDB_NAME=u548879916_jotform\nPORT=3000\nRESEND_API_KEY=YOUR_KEY_HERE`;
        fs.writeFileSync(path.join(PROD_DIR, '.env'), envContent);
    }

    // 6. Create uploads folder
    fs.mkdirSync(path.join(PROD_DIR, 'uploads'));

    console.log('✅ Build Success! output is in "dist_production" folder.');

} catch (error) {
    console.error('❌ Build Failed:', error);
    process.exit(1);
}
