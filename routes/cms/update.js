const express = require('express');
const router = express.Router();
const https = require('https');
const OperationalError = require('../../functions/operational-error');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');


const prependTimestamp = (data) => {
    const now = new Date();
    const timestamp = now.toISOString();
    return `[${timestamp}] ${data}`;
};

const logDirectory = path.join(__dirname, '../../logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
const updateLogStream = fs.createWriteStream(path.join(logDirectory, 'update.log'), { flags: 'a' });

// Check for updates
router.get('/', async (req, res, next) => {

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
router.post('/', (req, res) => {
    // Execute the update command
    const updateCommand = 'git pull && pm2 reload birka --force';
    const updateProcess = exec(updateCommand, { cwd: path.join(__dirname, '../../') });

    updateProcess.stdout.on('data', (data) => {
        updateLogStream.write(prependTimestamp(data));
    });

    updateProcess.stderr.on('data', (data) => {
        updateLogStream.write(prependTimestamp(data));
    });

    updateProcess.on('exit', (code) => {
        if (code === 0) {
            res.status(200).json({ message: 'Update successful.' });
        } else {
            res.status(500).json({ message: 'Update failed.' });
        }
    });

    updateProcess.on('error', (err) => {
        console.error('Update process encountered an error:', err);
        res.status(500).json({ message: 'Update process encountered an error.' });
    });
});



module.exports = router;