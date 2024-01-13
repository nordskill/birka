const express = require('express');
const router = express.Router();
const passport = require('../../config/passport');

router.get('/', async (req, res, next) => {
    res.render('cms/login', {
        title: 'CMS Login',
        template_name: 'cms_login'
    });
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) { return res.status(401).json(info); }

        req.logIn(user, (err) => {
            if (err) { return next(err); }
            return res.redirect('/cms');
        });
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/cms/login');
});

module.exports = router;
