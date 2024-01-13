const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const passwordUtils = require('../functions/password-utils');

passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passReqToCallback: true
    },
    async (username, password, done) => {
        try {
            const user = await User.findOne({
                $or: [
                    { 'account_details.username': username },
                    { 'account_details.email': username }
                ]
            });

            if (!user) {
                return done(null, false, { message: 'Incorrect username or password.' });
            }

            const isValid = await passwordUtils.verifyPassword(password, user.password);
            if (!isValid) {
                return done(null, false, { message: 'Incorrect username or password.' });
            }

            // Handle "remember me" checkbox
            if (req.body.remember) {
                // Cookie expires after 30 days
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
            } else {
                // Cookie expires at end of session
                req.session.cookie.expires = false;
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
