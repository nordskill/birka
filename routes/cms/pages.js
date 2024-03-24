const express = require('express');
const router = express.Router();
const Page = require('../../models/page');
const OBJtoHTML = require('../../functions/obj-to-html');
const OperationalError = require('../../functions/operational-error');

const SLUG = 'page';
const TITLE = 'Page';

// CMS Pages
router.get('/', async (req, res, next) => {

    try {
        const pages = await Page.find()
            .populate('author tags')
            .lean();

        res.render(`cms/${SLUG}s`, {
            title: `${TITLE}s`,
            template_name: `cms_${SLUG}s`,
            active: `${SLUG}s`,
            pages,
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
    } catch (error) {
        next(error);
    }
});

router.get(`/:id`, async (req, res, next) => {

    const id = req.params.id;
    const page = await Page.findById(id)
        .populate('author tags')
        .lean();

    if (!page) {
        return next(
            new OperationalError(`Page not found, ID: ${id}`, 404)
        );
    }

    res.render(`cms/${SLUG}`, {
        title: page.name,
        template_name: `cms_${SLUG}`,
        active: `${SLUG}s`,
        page,
        renderHTML: OBJtoHTML,
        breadcrumbs: [{
            name: 'CMS',
            href: '/cms'
        },
        {
            name: `${TITLE}s`,
            href: `/cms/${SLUG}s`
        },
        {
            name: page.name,
            href: `/cms/${SLUG}s/${page.slug}`
        }
        ],
        scripts: [
            'validation-form.js'
        ]
    });
});

module.exports = router;