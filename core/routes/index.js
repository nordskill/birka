const express = require('express');
const router = express.Router();
const path = require('path');
const ejs = require('ejs');
const Page = require('../models/page');
const OperationalError = require('../functions/operational-error');

// Utility function to render EJS templates
async function renderTemplate(res, page, next) {

    try {
        
        const templateFile = path.join(res.app.get('views')[0], page.template + '.ejs');
        
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
            data: page
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
router.get('/:slug', async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const page = await Page.findOne({ slug: slug })
            .select('-__v')
            .populate('img_preview tags')
            .lean();
        if (!page) throw new OperationalError('Page not found', 404);
        await renderTemplate(res, page, next);
    } catch (error) {
        next(error);
    }
});

// Route for fetching the homepage
router.get('/', async (req, res, next) => {
    try {
        const page = await Page.findOne({ is_home: true })
            .select('-__v')
            .populate('img_preview tags')
            .lean();
        if (page) {
            await renderTemplate(res, page, next);
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

module.exports = router;
