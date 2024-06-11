const fs = require('fs').promises;
const path = require('path');

async function copyFiles(from, to) {
    try {
        const files = await fs.readdir(from);

        await fs.mkdir(to, { recursive: true });

        const copyOperations = files.map(async (file) => {
            const fromPath = path.join(from, file);
            const toPath = path.join(to, file);
            const stat = await fs.stat(fromPath);

            if (stat.isFile()) {
                await fs.copyFile(fromPath, toPath);
            } else if (stat.isDirectory()) {
                await copy_files(fromPath, toPath);
            }
        });

        await Promise.all(copyOperations);
    } catch (error) {
        console.error('Error copying files:', error);
    }
}

module.exports = { copyFiles };
