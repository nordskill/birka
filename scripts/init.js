const loadVars = require('../core/functions/vars');
const db = require('../core/functions/db-connect');
const passwordUtils = require('../core/functions/password-utils');
const Member = require('../core/models/member');
const initConfig = require('../config/init');
const PERMISSIONS = require('../config/permissions');

loadVars();

const getAllPermissions = () => Object.values(PERMISSIONS).map(perm => perm.key);

(async () => {
    await db.connect();
    console.log('----------');
    
    if (typeof initConfig.member.password !== 'string' || initConfig.member.password.trim() === '') {
        console.warn('You must set password in the config/init.js before creating user.');
        db.disconnect();
        process.exit(1);
    }

    const memberData = {
        username: initConfig.member.username,
        password: await passwordUtils.hashPassword(initConfig.member.password),
        email: initConfig.member.email,
        permissions: getAllPermissions(),
        email_notifications: initConfig.member.email_notifications || false,
        web_notifications: initConfig.member.web_notifications || false
    };

    try {
        await Member.create(memberData);
        console.log(`Member ${memberData.username} created with full permissions.`);
    } catch (error) {
        console.error('Error creating member:', error);
    }

    console.log('----------');
    db.disconnect();
    process.exit(0);
})();
