const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
    res.render('cms/login', {
        title: 'CMS Login',
        template_name: 'cms_login'
    });
});

module.exports = router;
