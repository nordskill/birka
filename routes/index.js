const express = require('express');
const router = express.Router();
const Page = require('../models/page'); // Assuming you have a Page model for MongoDB
const OperationalError = require('../functions/operational-error');

// Route for fetching a page based on its slug
router.get('/:slug', async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const page = await Page.findOne({ slug: slug });
        if (page) {
            res.render(page.template, {
                title: page.name,
                excerpt: page.excerpt,
                template_name: page.template
            });
        } else {
            throw new OperationalError('Page not found', 404);
        }
    } catch (error) {
        next(error);
    }
});

// Route for fetching the homepage
router.get('/', async (req, res, next) => {
    try {
        const page = await Page.findOne({ is_home: true });
        if (page) {
            res.render(page.template, {
                title: page.name,
                excerpt: page.excerpt,
                template_name: page.template
            });
        } else { // if no home page is set, render a default template
            const defaultTemplate = 'default_home';
            res.render(defaultTemplate, {
                title: 'This is a Default Home Page',
                content: 'Because none of the pages are marked as home.',
                template_name: defaultTemplate
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;