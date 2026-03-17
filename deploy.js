const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const CLIENT_DIR = path.join(ROOT, 'client');

const run = (cmd, cwd = ROOT) => {
    console.log(`\n▶ ${cmd}`);
    execSync(cmd, { cwd, stdio: 'inherit' });
};

const msg = process.argv[2] || 'deploy: update site';

console.log('🚀 Deploy script starting...\n');

try {
    // 1. Build the React client
    console.log('⚛️  Building React app...');
    run('npm install', CLIENT_DIR);
    run('npm run build', CLIENT_DIR);
    console.log('✅ React build done.\n');

    // 2. Git add everything (including the fresh client/dist)
    console.log('📦 Staging all files for git...');
    run('git add -A');
    run('git add client/dist -f');

    // 3. Check if there's anything to commit
    const status = execSync('git status --porcelain', { cwd: ROOT }).toString().trim();
    if (!status) {
        console.log('ℹ️  Nothing new to commit. Pushing anyway...');
    } else {
        run(`git commit -m "${msg}"`);
        console.log('✅ Committed.\n');
    }

    // 4. Push to GitHub → Hostinger auto-deploys
    console.log('📤 Pushing to GitHub...');
    run('git push origin main');
    console.log('\n🎉 Deploy complete! Hostinger will auto-deploy from GitHub.');

} catch (err) {
    console.error('\n❌ Deploy failed:', err.message);
    process.exit(1);
}
