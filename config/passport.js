const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const passwordUtils = require('../functions/password-utils');

passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
        session: true
    },
    async (username, password, done) => {
        try {
            const user = await User.findOne({
                $or: [
                    { 'account_details.username': username },
                    { 'account_details.email': username }
                ],
                'account_details.role': 'Administrator'
            });

            if (!user) {
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            
            const isValid = await passwordUtils.verifyPassword(password, user.account_details.password);
            if (!isValid) {
                return done(null, false, { message: 'Incorrect username or password.' });
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

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

module.exports = passport;