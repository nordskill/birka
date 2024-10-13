import passport from 'passport';
import LocalStrategy from 'passport-local';

import Member from '../core/models/member.js';
import { verifyPassword } from '../core/functions/password-utils.js';


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
            
            const isValid = await verifyPassword(password, member.password);
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

export default passport;