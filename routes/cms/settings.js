const express = require('express');
const router = express.Router();

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

module.exports = router;