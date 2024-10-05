const fs = require('fs').promises;
const https = require('https');
const path = require('path');
const mongoose = require('mongoose');
const sitemapConfig = require('../../config/sitemap.json');

class SiteMap {
    constructor() {
        this.config = sitemapConfig;
        this.basePath = path.join(__dirname, '../../public/');
        this.lastCheckedFile = path.join(__dirname, '../../scripts/sitemap-checked.json');
        this.models_to_update = [];
    }

    async regenerate_sitemaps({ check = true, notify_google = false }) {
        if (check) {
            await this.#check_for_updates();
        }
        const updatesNeeded = check ? this.models_to_update.map(model => this.config.models.find(m => m.model === model)) : this.config.models;
        await this.#generate_sitemaps(updatesNeeded);
        if (updatesNeeded.length > 0) {  // Only regenerate the sitemap index if there are updates
            await this.#generate_sitemapindex(updatesNeeded.map(m => m.model));
        }
        if (notify_google) {
            await this.#notify_google();
        }
    }

    async #notify_google() {
        const siteUrl = encodeURIComponent(GlobalSettings.seo.siteUrl);
        const feedpath = encodeURIComponent(`${GlobalSettings.domain}/sitemap_index.xml`);
        const options = {
            hostname: 'www.googleapis.com',
            port: 443,
            path: `/webmasters/v3/sites/${siteUrl}/sitemaps/${feedpath}`,
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GlobalSettings.seo.googleApiToken}`,
                'Content-Type': 'application/json'
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                res.setEncoding('utf8');
                let responseBody = '';
                res.on('data', (chunk) => { responseBody += chunk; });
                res.on('end', () => {
                    resolve(JSON.parse(responseBody));
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.end();
        });
    }

    async #generate_sitemaps(models) {
        return Promise.all(models.map(modelConfig => this.#generate_sitemap_for_model(modelConfig)));
    }

    async #generate_sitemap_for_model(modelConfig) {
        const Model = mongoose.model(modelConfig.model);
        const documents = await Model.find({ 'seo.exclude_from_sitemap': { $ne: true } });
        if (!documents.length) return;

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        for (const doc of documents) {
            sitemap += `<url>\n`;
            if (modelConfig.model === 'Page' && doc.is_home) {
                sitemap += `  <loc>${this.config.protocol}://${GlobalSettings.domain}/</loc>\n`;
                sitemap += `  <priority>1</priority>\n`;
            } else {
                sitemap += `  <loc>${this.config.protocol}://${GlobalSettings.domain}/${doc.slug}</loc>\n`;
                sitemap += `  <priority>${modelConfig.priority}</priority>\n`;
            }
            sitemap += `  <lastmod>${doc.updatedAt.toISOString()}</lastmod>\n`;
            sitemap += `  <changefreq>${modelConfig.changefreq}</changefreq>\n`;
            sitemap += `</url>\n`;
        }
        sitemap += `</urlset>\n`;

        await fs.writeFile(path.join(this.basePath, `${modelConfig.model.toLowerCase()}.xml`), sitemap, 'utf8');
    }

    async #generate_sitemapindex(models) {
        if (models.length === 0) {
            console.log("No models to update in sitemap index.");
            return; // Exit if no models to update to avoid overwriting with an empty index
        }

        let sitemapindex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        for (const model of models) {
            const filename = `${model.toLowerCase()}.xml`;
            const filepath = path.join(this.basePath, filename);
            try {
                const stats = await fs.stat(filepath);
                sitemapindex += `<sitemap>\n`;
                sitemapindex += `  <loc>${this.config.protocol}://${GlobalSettings.domain}/${filename}</loc>\n`;
                sitemapindex += `  <lastmod>${stats.mtime.toISOString()}</lastmod>\n`;
                sitemapindex += `</sitemap>\n`;
            } catch (error) {
                console.error(`Error accessing file ${filename}: ${error}`);
                continue; // Skip this file in the sitemap index if it doesn't exist
            }
        }
        sitemapindex += `</sitemapindex>\n`;

        await fs.writeFile(path.join(this.basePath, 'sitemap.xml'), sitemapindex, 'utf8');
        await this.#update_robots();
    }

    async #update_robots() {
        const robotsPath = path.join(this.basePath, 'robots.txt');
        const sitemapLine = `Sitemap: ${this.config.protocol}://${GlobalSettings.domain}/sitemap.xml`;

        try {
            const robotsExists = await fs.stat(robotsPath);
            if (robotsExists) {
                let content = await fs.readFile(robotsPath, 'utf8');
                if (!content.includes(sitemapLine)) {
                    content += `\n${sitemapLine}\n`;
                    await fs.writeFile(robotsPath, content, 'utf8');
                }
            } else {
                await fs.writeFile(robotsPath, sitemapLine + '\n', 'utf8');
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File does not exist, create it with the sitemap line
                await fs.writeFile(robotsPath, sitemapLine + '\n', 'utf8');
            } else {
                console.error(`Error handling robots.txt: ${error}`);
            }
        }
    }

    async #check_for_updates() {
        const lastChecked = await this.#read_last_checked();
        const currentCheck = new Date();

        for (const modelInfo of this.config.models) {
            const Model = mongoose.model(modelInfo.model);
            const updatedCount = await Model.countDocuments({
                updatedAt: { $gt: lastChecked }
            });

            if (updatedCount > 0) {
                this.models_to_update.push(modelInfo.model);
            }
        }

        await this.#write_last_checked(currentCheck);
    }

    async #read_last_checked() {
        try {
            const data = await fs.readFile(this.lastCheckedFile, 'utf8');
            return new Date(JSON.parse(data).lastChecked);
        } catch (error) {
            return new Date(0); // If there's an error, return a very old date to regenerate all sitemaps
        }
    }

    async #write_last_checked(date) {
        await fs.writeFile(this.lastCheckedFile, JSON.stringify({ lastChecked: date.toISOString() }), 'utf8');
    }
}

module.exports = SiteMap;
