const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Member = require('../models/member');
const passwordUtils = require('../functions/password-utils');

passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
        session: true
    },
    async (username, password, done) => {
        try {
            const member = await Member.findOne({
                $or: [
                    { 'username': username },
                    { 'email': username }
                ]
            });

            if (!member) {
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            
            const isValid = await passwordUtils.verifyPassword(password, member.password);
            if (!isValid) {
                return done(null, false, { message: 'Incorrect username or password.' });
            }

            return done(null, member);
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser((member, done) => {
    done(null, member.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const member = await Member.findById(id);
        done(null, member);
    } catch (error) {
        done(error);
    }
});

module.exports = passport;