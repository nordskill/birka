/**
 * Resizes an image to specified widths and saves the resized images to a target path.
 *
 * @param {string} originalPath - The path to the original image.
 * @param {Array<number>} widths - An array of widths to which the image should be resized.
 * @param {string} targetPath - The path where the resized images should be saved.
 * 
 * @returns {Promise<void>} A promise that resolves when the image has been resized and saved.
 *
 * @throws {Error} If there is an error with the path.
 *
 * @example
 * const originalPath = './images/original.jpg';
 * const widths = [300, 600, 900];
 * const targetPath = './images/resized';
 *
 * resizeImage(originalPath, widths, targetPath)
 *     .then(() => console.log('Image resizing completed.'))
 *     .catch(err => console.error('Error resizing image:', err));
 */

const sharp = require('sharp');
const { performance } = require('perf_hooks');
const ensurePathExists = require('./path-helper');
const path = require('path');

const FORMAT = 'webp';

async function resizeImage(originalPath, widths, targetPath) {
    try {
        const metadata = await sharp(originalPath).metadata();
        const isWebP = metadata.format === FORMAT;
        const originalFileName = path.basename(originalPath, path.extname(originalPath));

        // Ensure the original size is included
        if (!widths.includes(metadata.width)) {
            widths.push(metadata.width);
        }

        let convertedSizes = [];

        // Load the image into a buffer to reuse it
        const imageBuffer = await sharp(originalPath).toBuffer(); // Added to reuse the buffer

        // Sequential processing instead of parallel to conserve memory
        const start = performance.now();
        for (const width of widths) {
            if (metadata.width >= width) {
                const sizeFolderPath = path.join(targetPath, String(width));
                const pathResult = await ensurePathExists(sizeFolderPath);
                if (!pathResult.success) {
                    throw new Error('Error with path:', pathResult.error);
                }

                const outputPath = path.join(sizeFolderPath, `${originalFileName}.${FORMAT}`);
                const image = sharp(imageBuffer); // Reuse the buffer
                if (metadata.width > width) {
                    image.resize(width);
                }
                if (!isWebP) {
                    image.toFormat(FORMAT); // Format conversion only if necessary
                }
                convertedSizes.push(width);
                await image.toFile(outputPath);
            }
        }
        const duration = performance.now() - start;

        return {
            success: true,
            time: duration,
            sizes: convertedSizes,
            format: FORMAT
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

module.exports = resizeImage;