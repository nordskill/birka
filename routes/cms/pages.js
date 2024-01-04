const express = require('express');
const router = express.Router();
const Page = require('../../models/page');

const SLUG = 'page';
const TITLE = 'Page';

// CMS Pages
router.get('/', async (req, res, next) => {

    try {
        const pages = await Page.find()
            .populate('author tags sub_pages')
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

    const page = await Page.findById(req.params.id)
        .populate('author tags sub_pages')
        .lean();

    if (!page) {
        return next(
            new OperationalError('Page entity not found', 404)
        );
    }

    res.render(`cms/${SLUG}`, {
        title: page.name,
        template_name: `cms_${SLUG}`,
        active: `${SLUG}s`,
        page,
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