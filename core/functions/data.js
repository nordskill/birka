import fs from 'fs';
import path from 'path';

import { deepFreeze } from './deep-freeze.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadVars() {
	const languagesPath = path.join(__dirname, '../../data/languages.json');
	const countriesPath = path.join(__dirname, '../../data/countries.json');
	const currenciesPath = path.join(__dirname, '../../data/currencies.json');
	const userRoles = path.join(__dirname, '../../data/user-roles.json');

	try {
		const languages = loadFile(languagesPath);
		const countries = loadFile(countriesPath);
		const currencies = loadFile(currenciesPath);
		const user_roles = loadFile(userRoles);

		if (languages) {
			global.languages = deepFreeze(languages);
		}
		if (countries) {
			global.countries = deepFreeze(countries);
		}
		if (currencies) {
			global.currencies = deepFreeze(currencies);
		}
		if (user_roles) {
			global.user_roles = deepFreeze(user_roles);
		}
	} catch (err) {
		console.error(`Failed to load vars: ${err.message}`);
	}
};

function loadFile(filePath) {
	if (fs.existsSync(filePath)) {
		const fileContent = fs.readFileSync(filePath, 'utf8');
		const parsedContent = JSON.parse(fileContent);
		return parsedContent;
	}
	return null;
}

export default loadVars;
