/**
 * Scans a specified directory for SVG files, reads their contents, and
 * compiles them into an object where each property key is the file name
 * (without extension) and the value is the SVG content.
 *
 * The function relies on a helper function readSVG to read and process
 * the SVG file content.
 *
 * @function
 * @returns {Object} - An object containing the SVG icons indexed by their file name.
 *
 * @example
 * // Assuming src/svg directory contains home.svg and user.svg
 * // Returns: { home: '<svg ...></svg>', user: '<svg ...></svg>' }
 * loadSVGs();
 */

const fs = require('fs');
const path = require('path');

function loadSVGs() {
	const svgDir = path.join(__dirname, '..', 'src', 'svg');
	const svgFiles = fs.readdirSync(svgDir).filter(file => file.endsWith('.svg'));
	const svgData = {};

	for (let svgFile of svgFiles) {
		const filePath = path.join(svgDir, svgFile);
		const icon = path.basename(svgFile, '.svg');
		svgData[icon] = readSVG(filePath);
	}

	return svgData;
}

function readSVG(filePath) {
	let svgContent = fs.readFileSync(filePath, 'utf-8');
	svgContent = svgContent.replace(/ xmlns="[^"]+"/g, '');
	return svgContent;
}

module.exports = loadSVGs;