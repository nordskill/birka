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
            res.render(page.template, { // Assuming you have a generic page template
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
        const page = await Page.findOne({ is_home: true }); // Assuming you mark the homepage with an 'isHomepage' field
        if (page) {
            res.render(page.template, {
                title: page.name,
                excerpt: page.excerpt,
                template_name: page.template
            });
        } else {
            // If no homepage set, you can redirect to a default page or render a specific template
            res.render('default', { // 'default' should be replaced with your default page template if exists
                title: 'Default Home',
                content: 'Welcome to our site!'
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;