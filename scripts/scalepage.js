const fs = require('fs').promises;
const postcss = require('postcss');
const { performance } = require('perf_hooks');

// Define the plugin using the new API
const universalPxToVw = (scalingIndex) => {
    return {
        postcssPlugin: 'universal-px-to-vw',
        Once(root) {
            root.walkRules((rule) => {
                if (rule.parent.type !== 'atrule' || rule.parent.name !== 'media') {
                    let hasPx = false;
                    rule.walkDecls((decl) => {
                        if (decl.value.includes('px')) {
                            hasPx = true;
                            decl.value = decl.value.replace(/(\d+(\.\d+)?)px/g, (_, number) => {
                                return `${(number / scalingIndex).toFixed(2)}vw`;
                            });
                        } else {
                            decl.remove(); // Remove declarations without px
                        }
                    });
                    if (!hasPx) rule.remove(); // Remove rules without any px values
                } else {
                    rule.remove(); // Ignore rules within media queries
                }
            });
            // Remove empty media queries after processing
            root.walkAtRules('media', (atRule) => {
                if (atRule.nodes.length === 0) {
                    atRule.remove();
                }
            });
        }
    }
}
universalPxToVw.postcss = true;

async function convertPxToVwUniversal(cssFilePath, scalingIndex) {
    const startTime = performance.now();
    try {
        // Read the original CSS file
        const originalCss = await fs.readFile(cssFilePath, 'utf8');

        // Backup the original CSS file
        await fs.writeFile(`${cssFilePath}.backup`, originalCss);

        // Process the CSS
        const processedCss = await postcss([universalPxToVw(scalingIndex)]).process(originalCss, { from: undefined });

        // Generate new CSS content by appending the new media query to the original CSS
        const newMediaQuery = `\n@media (min-width: ${scalingIndex * 100}px) {\n${processedCss.css}\n}`;
        const newCssContent = originalCss + newMediaQuery;

        // Write the modified CSS to replace the original
        await fs.writeFile(cssFilePath, newCssContent, 'utf8');

        const endTime = performance.now();
        console.log(`CSS transformation completed in ${(endTime - startTime).toFixed(2)} milliseconds.`);
    } catch (error) {
        console.error("Error during CSS processing:", error);
        if (error.code === 'ENOENT') {
            console.error('The file does not exist.');
        } else if (error.code === 'EACCES') {
            console.error('Permission denied.');
        } else {
            console.error('An unexpected error occurred:', error);
        }
    }
}

// Accept command-line arguments for the file path and scaling index
const [cssFilePath, scalingIndex] = process.argv.slice(2);
if (!cssFilePath || !scalingIndex) {
    console.log('Usage: node scripts/transform-css.js <path_to_css_file> <scaling_index>');
} else {
    convertPxToVwUniversal(cssFilePath, parseFloat(scalingIndex));
}
