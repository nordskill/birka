const path = require('path');
const fs = require('fs').promises;

function generateImageMarkup(file, pathToFile){
    const markup = `<div class="file" data-id="${file._id}" data-type="image"><div class="shadow-inner d-none"></div><img src="${pathToFile}" alt="${file.alt}"></div>`
    return markup;
}

function generateVideoMarkup(file){
    return `<div class="file" data-id="${file._id}" data-type="video"><div class="shadow-inner d-none"></div><div class="w-100 h-100">video</div></div>`;
}

async function generateSVGMarkup(file, pathToFile){
    const svgFilePath = path.join(__dirname, '..', '..', pathToFile);
    const fileData = await fs.readFile(svgFilePath, 'utf8');

    return `<div class="file" data-id="${file._id}" data-type="image"><div class="shadow-inner d-none"></div>${fileData}</div>`;
}

module.exports = {
    generateImageMarkup,
    generateVideoMarkup,
    generateSVGMarkup
}