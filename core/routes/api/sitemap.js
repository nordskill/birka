import express from 'express';

import Sitemap from '../../functions/sitemap.js';

const router = express.Router();

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

export default router;
