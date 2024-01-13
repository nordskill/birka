const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {

    // if user is already logged in, redirect to dashboard
    if (req.user) return res.redirect('/cms');

    res.render('cms/login', {
        title: 'CMS Login',
        template_name: 'cms_login'
    });
});

module.exports = router;
