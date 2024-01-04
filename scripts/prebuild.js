const fs = require('fs');
const { exec } = require('child_process');
const buildJS = require('./build-js.js');

const fileChecks = [
    {
        filePath: 'public/js/main.js',
        action: buildJS
    },
    {
        filePath: 'public/css/style.css',
        action: runNodeSass
    }
];

checkAndProcess(fileChecks);

function checkAndProcess(filesActions) {
    filesActions.forEach(item => {
        fs.access(item.filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.log(`${item.filePath} does not exist. Building...`);
                if (item.action) {
                    item.action();
                }
            }
        });
    });
}

function runNodeSass() {
    const command = 'node-sass ./src/sass/ -o ./public/css/ --output-style compressed --source-map true';
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`node-sass output: ${stdout}`);
    });
}
