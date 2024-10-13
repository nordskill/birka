import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Loads variables from a .vars file and sets them as environment variables.
 * The .vars file should be in the parent directory of this module and should contain a JSON object.
 * Each key-value pair in the JSON object is set as an environment variable.
 *
 * @module loadVars
 * @returns {void}
 * @throws {Error} If there is an error reading the .vars file.
 */
export default function loadVars() {
	const filePath = path.join(__dirname, '../../.vars');
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
