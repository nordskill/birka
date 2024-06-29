const fs = require('fs').promises;
const path = require('path');

/**
 * Copies a file or directory contents from one location to another.
 * @param {string} from - Source path
 * @param {string} to - Destination path
 * @param {string} [fileName] - Optional. If provided, only this file will be copied.
 * @returns {Promise<void>}
 */
async function copyFiles(from, to, fileName = null) {
    try {
        if (fileName) {
            // Copy a single file
            const sourcePath = path.join(from, fileName);
            const destPath = path.join(to, fileName);
            
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.copyFile(sourcePath, destPath);
            console.log(`File ${fileName} copied successfully.`);
        } else {
            // Copy entire directory
            const files = await fs.readdir(from);
            await fs.mkdir(to, { recursive: true });

            for (const file of files) {
                const fromPath = path.join(from, file);
                const toPath = path.join(to, file);
                const stat = await fs.stat(fromPath);

                if (stat.isFile()) {
                    await fs.copyFile(fromPath, toPath);
                } else if (stat.isDirectory()) {
                    await copyFiles(fromPath, toPath);
                }
            }
            console.log(`Directory contents copied successfully from ${from} to ${to}.`);
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`File or directory not found: ${error.path}`);
        } else {
            throw new Error(`Error copying files: ${error.message}`);
        }
    }
}

module.exports = copyFiles;
