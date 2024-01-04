/**
 * Reads SVG files from a specified directory, processes their content, and generates
 * SVG sprites based on the icons used in the template files. It returns an object
 * containing the sprites indexed by the template name.
 *
 * @function
 * @returns {Object} - An object containing SVG sprites for each template, indexed by
 *                     the template name.
 *
 * @example
 * // Returns: {
 * //   template1: '<svg aria-hidden="true" ...></svg>',
 * //   template2: '<svg aria-hidden="true" ...></svg>',
 * //   ...
 * // }
 * generateSvgSprites();
 */

const fs = require('fs');
const path = require('path');

const generateSvgSprites = () => {

    const readSVG = (filePath) => {
        let svgContent = fs.readFileSync(filePath, 'utf-8');
        const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
        const viewBox = viewBoxMatch ? viewBoxMatch[1] : '';
        svgContent = svgContent.replace(/<\/?svg[^>]*>/g, '').trim();
        return { content: svgContent, viewBox };
    };

    const findUsedIconsInTemplate = (templateContent) => {
        const iconPattern = /xlink:href="#([a-zA-Z0-9_\-]+)"/g;
        const iconsSet = new Set();
        let match;

        while ((match = iconPattern.exec(templateContent)) !== null) {
            iconsSet.add(match[1]);
        }

        return Array.from(iconsSet);
    };

    const readTemplatesRecursively = (dir, baseDir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let files = [];

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files = files.concat(readTemplatesRecursively(fullPath, baseDir));
            } else if (entry.isFile() && entry.name.endsWith('.ejs')) {
                const relativePath = path.relative(baseDir, fullPath);
                files.push(relativePath);
            }
        }

        return files;
    };

    const svgDir = path.join(__dirname, '..', 'src', 'svg');
    const svgFiles = fs.readdirSync(svgDir).filter(file => file.endsWith('.svg'));
    const svgData = {};

    for (const svgFile of svgFiles) {
        const filePath = path.join(svgDir, svgFile);
        const icon = path.basename(svgFile, '.svg');
        svgData[icon] = readSVG(filePath);
    }

    const templatesDir = path.join(__dirname, '..', 'views');
    const templateFiles = readTemplatesRecursively(templatesDir, templatesDir);
    const templateSprites = {};

    for (const templateRelPath of templateFiles) {
        const templateName = path.basename(templateRelPath, '.ejs');
        const uniqueTemplateName = templateRelPath.replace(path.sep, '_').replace('.ejs', '');
        const filePath = path.join(templatesDir, templateRelPath);
        const templateContent = fs.readFileSync(filePath, 'utf-8');
        const usedIcons = findUsedIconsInTemplate(templateContent);

        let sprite = '<svg aria-hidden="true" style="display:none;">\n';
        for (const icon of usedIcons) {
            if (svgData[icon]) {
                sprite += `\t<symbol id="${icon}" viewBox="${svgData[icon].viewBox}">\n`;
                sprite += `\t\t${svgData[icon].content}\n`;
                sprite += '\t</symbol>\n';
            }
        }
        sprite += '</svg>';
        templateSprites[uniqueTemplateName] = sprite;
    }

    return templateSprites;
};

module.exports = generateSvgSprites;

