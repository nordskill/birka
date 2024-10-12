const express = require('express');
const router = express.Router();
const Sitemap = require('../../functions/sitemap');

router.post('/', async (req, res, next) => {
    try {
        const sitemap = new Sitemap();
        await sitemap.regenerate_sitemaps({
            check: false
        }, req.app);
        res.status(200).json({ message: 'Sitemap generation initiated successfully.' });
    } catch (err) {
        next(err);
    }
});

router.patch('/', async (req, res, next) => {
    try {
        const sitemap = new Sitemap();
        await sitemap.regenerate_sitemaps({
            check: true
        }, req.app);
        res.status(200).json({ message: 'Sitemap regeneration with check initiated successfully.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
