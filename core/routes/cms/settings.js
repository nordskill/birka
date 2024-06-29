const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const router = express.Router();
const SiteSettings = require('../../models/settings');
const OperationalError = require('../../functions/operational-error');
const multer = require('multer');
const upload = multer();
const copyFiles = require('../../functions/copy-files');

const SLUG = 'settings';
const TITLE = 'Settings';


const skinsFolder = path.join(__dirname, '../../../custom');
// const defaultSkin = path.join(__dirname, '../../package.json');

// CMS Tags
router.get('/', async (req, res, next) => {

    let availableSkins = [];

    try {
        // read package.json from every directory inside skins/ and if it exists add it to the array as JS object
        const skins = await fs.readdir(skinsFolder);
        const skinData = await Promise.all(skins.map(async skin => {
            try {
                const package = await fs.readFile(path.join(`${skinsFolder}/${skin}/package.json`), 'utf8');
                return JSON.parse(package);
            } catch (error) {
                return null;
            }
        }));
        availableSkins = skinData.filter(skin => skin !== null);

        // Add default skin to the availableSkins array
        // try {
        //     const defaultPackage = await fs.readFile(defaultSkin, 'utf8');
        //     const defaultSkinData = JSON.parse(defaultPackage);
        //     availableSkins.push(defaultSkinData);
        // } catch (error) {
        //     return next(new OperationalError('Error reading default skin package.json', 500));
        // }

        res.render(`cms/${SLUG}`, {
            title: TITLE,
            template_name: `cms_${SLUG}`,
            active: SLUG,
            skins: availableSkins,
            breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: TITLE,
                href: `/cms/${SLUG}`
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

router.patch('/', upload.none(), async (req, res, next) => {

    const settings = await SiteSettings.findOne();
    if (!settings) {
        return next(new OperationalError('Settings not found.', 404));
    }
    for (const key in req.body) {
        if (settings[key] !== undefined) {
            settings[key] = req.body[key];
            SS[key] = req.body[key];
        }
    }

    await settings.save();

    // Copy logo if the skin has been updated
    if (req.body.skin) {
        const source = path.join(skinsFolder, req.body.skin);
        const destination = path.join(__dirname, '../../../public');

        try {
            await copyFiles(source, destination, 'favicon.ico');
            console.log('Logo copied successfully');
        } catch (error) {
            console.error('Error copying logo:', error.message);
            // We don't throw here to allow the settings update to complete
        }

        try {
            await copyFiles(source, destination, 'site.webmanifest');
            console.log('webmanifest copied successfully');
        } catch (error) {
            console.error('Error copying webmanifest:', error.message);
            // We don't throw here to allow the settings update to complete
        }
    }

    res.json({
        success: true,
        message: 'Settings updated successfully.'
    });
});

module.exports = router;