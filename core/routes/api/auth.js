import express from 'express';

import passport from '../../../config/passport.js';
import OperationalError from '../../functions/operational-error.js';

const router = express.Router();

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

export default router;
