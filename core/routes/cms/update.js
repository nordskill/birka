import express from 'express';
import https from 'https';
import { exec } from 'child_process';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';


const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoPath = path.join(__dirname, '../../../');
const logDirectory = path.join(__dirname, '../../../logs');
const backupDirectory = path.join(__dirname, '../../../_backup');

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
fs.existsSync(backupDirectory) || fs.mkdirSync(backupDirectory);

const updateUpstream = 'https://github.com/nordskill/birka.git';
const updateLogStream = fs.createWriteStream(path.join(logDirectory, 'update.log'), { flags: 'a' });

// Check for updates
router.get('/', async (req, res, next) => {

    updateLogStream.write(`------------ Checking Updates : ${new Date().toISOString()} ------------\n`);

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

    updateLogStream.write(`------------ Updating Birka : ${new Date().toISOString()} ------------\n`);

    try {

        // Add the new remote if not already added
        updateLogStream.write(`git remote add upstream ${updateUpstream}\n`);
        try {
            await execLog(`git remote add upstream ${updateUpstream}`);
        } catch (e) {
            updateLogStream.write(`Remote 'upstream' already exists.\n`);
        }

        updateLogStream.write(`git fetch upstream\n`);
        await execLog('git fetch upstream');

        updateLogStream.write(`git diff --name-only HEAD upstream/main\n`);
        const modifiedFiles = await execLog('git diff --name-only HEAD upstream/main');

        if (modifiedFiles.trim().length === 0) {
            updateLogStream.write(`No updates found.\n`);
            res.status(200).json({
                success: false,
                message: 'No updates found.',
                version: require('../../../package.json').version
            });
            return; // Exit early if no updates
        }

        // Backup modified files
        modifiedFiles.split('\n').filter(Boolean).forEach(file => {
            const fullPath = path.join(repoPath, file);
            const backupPath = path.join(backupDirectory, file);
            fs.mkdirSync(path.dirname(backupPath), { recursive: true });

            // Check if the file exists before copying
            if (fs.existsSync(fullPath)) {
                fs.copyFileSync(fullPath, backupPath);
            } else {
                updateLogStream.write(`File not found: ${fullPath}\n`);
            }
        });

        // Merge updates from the new remote
        updateLogStream.write(`git merge upstream/main --allow-unrelated-histories\n`);
        await execLog('git merge upstream/main --allow-unrelated-histories');
        const requiresBuild = /src\/(fonts|js|sass)/.test(modifiedFiles);

        if (requiresBuild) {
            updateLogStream.write(`npm run build\n`);
            await execLog('npm run build');
        }

        updateLogStream.write(`Update successful.\n`);
        res.status(200).json({
            success: true,
            message: 'Update successful.',
            modified_files: modifiedFiles.split('\n').filter(Boolean)
        });

        setTimeout(() => {
            updateLogStream.write(`pm2 reload birka --update-env\n`);
            execLog('pm2 reload birka --update-env');
        }, 1000);

    } catch (error) {
        updateLogStream.write(`[ERROR] ${error.message}\n`);
        res.status(500).json({ message: 'Update process encountered an error.', error: error.message });
    }

});

function execLog(command, options = {}) {
    return new Promise((resolve, reject) => {
        const process = exec(command, { ...options, cwd: repoPath });
        let output = '';

        process.stdout.on('data', data => {
            updateLogStream.write(data);
            output += data;
        });

        process.stderr.on('data', data => {
            updateLogStream.write(data);
        });

        process.on('exit', code => {
            if (code === 0) resolve(output);
            else reject(new Error(`Command failed with exit code ${code}`));
        });
    });
}


export default router;