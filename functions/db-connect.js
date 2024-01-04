const mongoose = require('mongoose');

module.exports = {
    connect: async function () {

        const host = process.env.DB_HOST || '127.0.0.1';
        const port = process.env.DB_PORT || 27017;
        const dbName = process.env.DB_NAME || 'birka';
        const user = process.env.DB_USER;
        const password = process.env.DB_PASSWORD;
        
        let dbLink = `mongodb://${host}:${port}/${dbName}`;

        if (user && password) {
            dbLink = `mongodb://${user}:${password}@${host}:${port}/${dbName}`;
        }

        // mongoose.set('useFindAndModify', false);

        try {
            await mongoose.connect(dbLink);
            console.log('DB Connected.');
            module.exports.connection = mongoose.connection;
        } catch (error) {
            console.error('connection error:', error);
        }

    },
    disconnect: async function () {
        await mongoose.connection.close();
    }
}