const express = require('express');
const router = express.Router();
const https = require('https');
const OperationalError = require('../../functions/operational-error');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');


const logDirectory = path.join(__dirname, '../../logs');
const backupDirectory = path.join(__dirname, '../../_backup');

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
fs.existsSync(backupDirectory) || fs.mkdirSync(backupDirectory);

const updateLogStream = fs.createWriteStream(path.join(logDirectory, 'update.log'), { flags: 'a' });

// Check for updates
router.get('/', async (req, res, next) => {

    updateLogStream.write(`------------ Updating Birka : ${new Date().toISOString()} ------------\n`);

    try {

        https.get('https://api.github.com/repos/nordskill/birka/releases/latest', {
            headers: {
                'User-Agent': 'NodeJS HTTPS Client'
            }
        }, (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', () => {
                const release = JSON.parse(data);
                console.log(release);

                res.json(release);
            });

        }).on("error", (err) => {
            console.error("Error: " + err.message);
        });


    } catch (err) {
        next(err);
    }

});

// Update the app
router.post('/', async (req, res) => {
    const repoPath = path.join(__dirname, '../../');
    updateLogStream.write(`------------ Updating Birka : ${new Date().toISOString()} ------------\n`);

    try {
        await execLog('git fetch origin');
        const modifiedFiles = await execLog('git diff --name-only HEAD origin/main');

        modifiedFiles.split('\n').filter(Boolean).forEach(file => {
            const fullPath = path.join(repoPath, file);
            const backupPath = path.join(backupDirectory, file);
            fs.mkdirSync(path.dirname(backupPath), { recursive: true });
            fs.copyFileSync(fullPath, backupPath);
        });

        await execLog('git pull origin main');
        const requiresBuild = /src\/(fonts|js|sass)/.test(modifiedFiles);

        if (requiresBuild) {
            await execLog('npm run build');
        }

        await execLog('pm2 reload birka --update-env');

        const packageJson = require('../../package.json');
        res.status(200).json({
            message: 'Update successful.',
            version: packageJson.version,
            modified_files: modifiedFiles.split('\n').filter(Boolean)
        });
    } catch (error) {
        updateLogStream.write(`[ERROR] ${error.message}\n`);
        res.status(500).json({ message: 'Update process encountered an error.', error: error.message });
    }

    function execLog(command, options = {}) {
        return new Promise((resolve, reject) => {
            const process = exec(command, { ...options, cwd: repoPath });
            let output = '';

            process.stdout.on('data', data => {
                updateLogStream.write(data);
                output += data;
            });

            process.stderr.on('data', data => {
                updateLogStream.write(`[ERROR] ${data}`);
            });

            process.on('exit', code => {
                if (code === 0) resolve(output);
                else reject(new Error(`Command failed with exit code ${code}`));
            });
        });
    }
});


module.exports = router;