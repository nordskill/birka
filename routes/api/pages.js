const express = require('express');
const router = express.Router();
const Page = require('../../models/page');

router.get('/search', async (req, res, next) => {
    try {
        const options = {
            name: { $regex: req.query.name, $options: 'i' }
        };
        const pages = await Page.find(options)
            .limit(5)
            .lean();

        res.json(pages);
    } catch (err) {
        next(err);
    }
});

module.exports = router;