import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

import Notification from '../../models/notification.js';
import User from '../../models/user.js';


const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SLUG = 'notification';
const TITLE = 'Notification';

router.get('/', async (req, res, next) => {
    try {
        const notifications = await Notification.find()
            .populate('notify_users email_template')
            .sort({ 'createdAt': -1 })
            .select('-__v')
            .lean();

        res.render(`cms/${SLUG}s`, {
            title: `${TITLE}s`,
            template_name: `cms_${SLUG}s`,
            active: `${SLUG}s`,
            notifications,
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
    } catch (error) {
        next(error);
    }
});

router.get(`/:id`, async (req, res, next) => {

    const notification = await Notification.findById(req.params.id)
        .populate('notify_users email_template')
        .select('-__v')
        .lean();

    if (!notification) {
        return next(
            new OperationalError("Notification not found", 404)
        )
    }

    const emailTemplatesFolder = path.join(__dirname, `../../views/emails/`);

    try {
        const email_templates = await readFilesFromDirectory(emailTemplatesFolder);
        const users = await User.find({ 'account_details.role': { $ne: 'customer' } })
            .lean();

        let notify_customer = false;

        notification.notify_users.forEach(notified_user => {
            if (notified_user.account_details?.role === 'customer') notify_customer = true;
            const user = users.find(user => {
                return user._id.toString() === notified_user._id.toString();
            });
            if (user) user.selected = true;
        });

        res.render(`cms/${SLUG}`, {
            title: notification.name,
            template_name: `cms_${SLUG}`,
            active: `${SLUG}s`,
            notification,
            email_templates,
            users,
            notify_customer,
            breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: `${TITLE}s`,
                href: `/cms/${SLUG}s`
            },
            {
                name: notification.name,
                href: `/cms/${SLUG}s/${notification._id}`
            }
            ],
            scripts: [
                'validation-form.js'
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