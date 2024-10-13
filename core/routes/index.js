import express from 'express';
import path from 'path';
import ejs from 'ejs';

import Page from '../models/page.js';
import OperationalError from '../functions/operational-error.js';
import cacheMiddleware from '../middleware/cache.js';

const router = express.Router();

// Utility function to render EJS templates
async function renderTemplate(req, res, page, next) {

    try {

        const templateFile = path.join(res.app.get('views')[0], page.template + '.ejs');

        let json_ld = '';

        if (page.seo?.jsonld_template) {
            json_ld = await ejs.render(page.seo.jsonld_template, { data: page });
        }

        const html = await ejs.renderFile(templateFile, {
            env: res.locals.env,
            menus: res.locals.menus,
            cookies_consent: res.locals.cookies_consent,
            csrf_token: res.locals.csrf_token,
            getData: res.locals.getData,
            getField: res.locals.getField,
            getImgTag: res.locals.getImgTag,
            title: page.name,
            template_name: page.template,
            data: page,
            baseUrl: `${req.protocol}://${req.get('host')}`,
            json_ld,
            GlobalSettings: req.app.locals.GlobalSettings
        }, {
            async: true,
            rmWhitespace: true
        });

        res.send(html);

    } catch (error) {
        next(error);
    }
}

// Route for fetching a page based on its slug
router.get('/:slug', cacheMiddleware, async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const page = await Page.findOne({ slug: slug })
            .select('-__v')
            .populate('img_preview tags')
            .lean();
        if (!page) throw new OperationalError('Page not found', 404);
        await renderTemplate(req, res, page, next);
    } catch (error) {
        next(error);
    }
});

// Route for fetching the homepage
router.get('/', cacheMiddleware, async (req, res, next) => {
    try {
        const page = await Page.findOne({ is_home: true })
            .select('-__v')
            .populate('img_preview tags')
            .lean();
        if (page) {
            await renderTemplate(req, res, page, next);
        } else {
            // Handle no home page set by rendering a default template
            res.locals.title = 'Home';
            res.locals.content = 'Because none of the pages are marked as home.';
            await renderTemplate(res, {
                template: 'default_home.ejs',
                ...res.locals
            }, next);
        }
    } catch (error) {
        next(error);
    }
});

export default router;
