const express = require('express');
const router = express.Router();

const SLUG = 'order';
const TITLE = 'Order';

// CMS Orders
router.get('/', async (req, res, next) => {
    res.render(`cms/${SLUG}s`, {
        title: `${TITLE}s`,
        template_name: `cms_${SLUG}s`,
        active: `${SLUG}s`,
        breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: `${TITLE}s`,
                href: `/cms/${SLUG}s`
            }
        ],
        scripts: [
            'validation-form.js'
        ]
    });
});

router.get(`/${SLUG}`, async (req, res, next) => {
    res.render(`cms/${SLUG}`, {
        title: 'Order #',
        template_name: `cms_${SLUG}`,
        active: `${SLUG}s`,
        order: {
            number: 'MS-4326',
        },
        breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: `${TITLE}s`,
                href: `/cms/${SLUG}s`
            },
            {
                name: 'Order #MS-4326',
                href: `/cms/${SLUG}s/${SLUG}`
            }
        ]
    });
});

module.exports = router;