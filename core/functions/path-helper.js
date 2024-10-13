import fs from 'fs/promises';

/**
 * Asynchronously checks if a path exists, and if it doesn't, creates the folders recursively.
 * Handles errors internally and returns a status object.
 * @param {string} filePath - The path to check and potentially create.
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
async function ensurePathExists(dirPath) {
    try {
        await fs.access(dirPath);
        return { success: true, error: null };
    } catch (error) {
        if (error.code === 'ENOENT') {
            try {
                await fs.mkdir(dirPath, { recursive: true });
                return { success: true, error: null };
            } catch (mkdirError) {
                return { success: false, error: mkdirError };
            }
        } else {
            return { success: false, error: error };
        }
    }
}

export default ensurePathExists;
