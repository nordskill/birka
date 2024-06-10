const express = require('express');
const router = express.Router();
const passport = require('../../../config/passport');
const OperationalError = require('../../functions/operational-error');

// /api/auth/login
router.post('/login', async (req, res, next) => {

    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(new OperationalError(err.message, 500));
        }
        if (!user) {
            return next(new OperationalError(info.message, 401));
        }
        req.logIn(user, (err) => {

            // Set maxAge based on user's choice
            if (req.body.remember) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            } else {
                req.session.cookie.expires = false;
            }

            // Save the session after modifying maxAge
            req.session.save(err => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                return res.status(200).json({ success: true });
            });

        });
    })(req, res, next);

});

router.get('/logout', async (req, res, next) => {

    req.logout(function (err) {

        if (err) return next(err);
        res.redirect('/');

    });

});

module.exports = router;
