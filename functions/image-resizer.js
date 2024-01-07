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

        const resizeTasks = widths.map(async (width) => {
            if (metadata.width >= width) {
                const sizeFolderPath = path.join(targetPath, String(width));
                const pathResult = await ensurePathExists(sizeFolderPath);
                if (!pathResult.success) {
                    throw new Error('Error with path:', pathResult.error);
                }

                const outputPath = path.join(sizeFolderPath, `${originalFileName}${isWebP ? '' : '.' + FORMAT}`);
                const image = sharp(originalPath);
                if (metadata.width > width) {
                    image.resize(width);
                }
                if (!isWebP) {
                    image.toFormat(FORMAT);
                }
                convertedSizes.push(width);
                return image.toFile(outputPath);
            }
        });

        const start = performance.now();
        await Promise.all(resizeTasks.filter(task => task !== undefined));
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
