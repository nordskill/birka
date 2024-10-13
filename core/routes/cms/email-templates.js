import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

import EmailTemplate from '../../models/email-template.js';


const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SLUG = 'email-template';
const TITLE = 'Email Template';

router.get('/', async (req, res, next) => {

    try {
        const templates = await EmailTemplate.find()
            .sort({ createdAt: -1 })
            .select('-__v')
            .lean();

        res.render(`cms/${SLUG}s`, {
            title: `${TITLE}s`,
            template_name: `cms_${SLUG}s`,
            active: `${SLUG}s`,
            templates,
            breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: `${TITLE}s`,
                href: `/cms/${SLUG}s`
            }
            ]
        });

    } catch (err) {
        next(err);
    }
});

router.get(`/:id`, async (req, res, next) => {

    const template = await EmailTemplate.findById(req.params.id)
        .select('-__v')
        .lean();

    if (!template) {
        return next(
            new OperationalError("Template not found", 404)
        )
    }

    const emailTemplatesFolder = path.join(__dirname, `../../views/emails/`);

    try {
        const templates = await readFilesFromDirectory(emailTemplatesFolder);

        res.render(`cms/${SLUG}`, {
            title: template.name,
            template_name: `cms_${SLUG}`,
            active: `${SLUG}s`,
            template,
            templates,
            template_content: templates.find(item => item.file_name === template.file_name).content,
            breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: `${TITLE}s`,
                href: `/cms/${SLUG}s`
            },
            {
                name: template.name,
                href: `/cms/${SLUG}s/${SLUG}`
            }
            ]
        });

    } catch (error) {
        next(error);
    }
});

export default router;

async function readFilesFromDirectory(dirPath) {
    const fileObjects = [];
    try {
        const files = await fs.readdir(dirPath);

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            if (await isDirectory(filePath)) continue;

            const content = await fs.readFile(filePath, 'utf8');
            fileObjects.push({ file_name: file, content });
        }

        return fileObjects;
    } catch (error) {
        console.error('Error reading files:', error);
        throw error;
    }
}
async function isDirectory(filePath) {
    try {
        const stats = await fs.lstat(filePath);
        return stats.isDirectory();
    } catch (error) {
        console.error('Error checking if file is a directory:', error);
        throw error;
    }
}