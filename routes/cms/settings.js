const express = require('express');
const router = express.Router();
const SiteSettings = require('../../models/settings');
const OperationalError = require('../../functions/operational-error');
const multer  = require('multer');
const upload = multer();

const SLUG = 'settings';
const TITLE = 'Settings';

// CMS Tags
router.get('/', async (req, res, next) => {
    res.render(`cms/${SLUG}`, {
        title: TITLE,
        template_name: `cms_${SLUG}`,
        active: SLUG,
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
});

router.patch('/', upload.none(), async (req, res, next) => {

    const settings = await SiteSettings.findOne();
    if (!settings) {
        return next(new OperationalError('Settings not found.', 404));
    }
    for (const key in req.body) {
        if (settings[key] !== undefined) {
            console.log(req.body[key]);
            settings[key] = req.body[key];
            SS[key] = req.body[key];
        }
    }
    
    await settings.save();

    res.json({
        success: true,
        message: 'Settings updated successfully.'
    });
});

module.exports = router;