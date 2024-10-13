import fs from 'fs/promises';
import path from 'path';
import express from 'express';

import Page from '../../models/page.js';
import Member from '../../models/member.js';
import OBJtoHTML from '../../functions/obj-to-html.js';
import OperationalError from '../../functions/operational-error.js';

const router = express.Router();
const SLUG = 'page';
const TITLE = 'Page';

// CMS Pages
router.get('/', async (req, res, next) => {

    const submodelTypes = [];

    for (const key in global.subModels) {
        if (Object.hasOwnProperty.call(global.subModels, key)) {
            const element = global.subModels[key];
            submodelTypes.push(element.type);
        }
    }

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
            submodels: submodelTypes,
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
        .populate('tags img_preview')
        .lean();

    if (!page) {
        return next(
            new OperationalError(`Page not found, ID: ${id}`, 404)
        );
    }

    const viewsPath = req.app.get('views')[0];
    const templates = [];

    let content = page.content;
    let content_rendered = '';

    if (Array.isArray(page.draft) && page.draft.length > 0) {
        const firstBlock = page.draft[0];
        if (Object.keys(firstBlock).length > 0) {
            content = page.draft;
        }
    }

    if (content) content_rendered = await OBJtoHTML(content);

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
            model: Page.schema.paths,
            page,
            templates,
            team,
            content_rendered,
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
            }]
        });

    } catch (error) {
        return next(error);
    }
});

export default router;