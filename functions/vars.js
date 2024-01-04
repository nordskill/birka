const fs = require('fs');
const path = require('path');

module.exports = function loadVars() {
	const filePath = path.join(__dirname, '../.vars');
	try {
		if (fs.existsSync(filePath)) {
			const fileContent = fs.readFileSync(filePath, 'utf8');
			const jsonVars = JSON.parse(fileContent);

			for (const [key, value] of Object.entries(jsonVars)) {
				process.env[key] = String(value);
			}
		}
	} catch (err) {
		console.error(`Failed to load .vars file: ${err.message}`);
	}
};
