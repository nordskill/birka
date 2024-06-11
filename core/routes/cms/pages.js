const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const router = express.Router();
const Page = require('../../models/page');
const Member = require('../../models/member');
const OBJtoHTML = require('../../functions/obj-to-html');
const OperationalError = require('../../functions/operational-error');
const { getSubmodels } = require('../../functions/model-loader');

const SLUG = 'page';
const TITLE = 'Page';

// CMS Pages
router.get('/', async (req, res, next) => {

    const pageSubmodels = getSubmodels('Page');

    try {
        const pages = await Page.find()
            .populate({
                path: 'author',
                select: '_id username'
            })
            .populate('tags')
            .lean();


        res.render(`cms/${SLUG}s`, {
            title: `${TITLE}s`,
            template_name: `cms_${SLUG}s`,
            active: `${SLUG}s`,
            pages,
            submodels: pageSubmodels,
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
        .populate({
            path: 'author',
            select: '_id username'
        })
        .populate('tags')
        .lean();

    if (!page) {
        return next(
            new OperationalError(`Page not found, ID: ${id}`, 404)
        );
    }

    const viewsPath = req.app.get('views')[0];
    const templates = [];

    try {
        const files = await fs.readdir(viewsPath);

        for (let file of files) {
            const filePath = path.join(viewsPath, file);
            if ((await fs.stat(filePath)).isFile()) {
                templates.push(path.basename(file, path.extname(file)));
            }
        }

        const team = await Member.find({})
            .select('_id username')
            .lean();

        res.render(`cms/${SLUG}`, {
            title: page.name,
            template_name: `cms_${SLUG}`,
            active: `${SLUG}s`,
            page,
            templates,
            team,
            renderHTML: OBJtoHTML,
            breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            }, {
                name: `${TITLE}s`,
                href: `/cms/${SLUG}s`
            }, {
                name: page.name,
                href: `/cms/${SLUG}s/${page.slug}`
            }],
            scripts: [
                'validation-form.js'
            ]

        });

    } catch (error) {
        return next(error);
    }
});

module.exports = router;