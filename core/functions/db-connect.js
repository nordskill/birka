import mongoose from 'mongoose';

const db = {
    getMongoUri: function () {
        const host = process.env.DB_HOST || '127.0.0.1';
        const port = process.env.DB_PORT || 27017;
        const dbName = process.env.DB_NAME || 'birka';
        const user = process.env.DB_USER;
        const password = process.env.DB_PASSWORD;
        const authSource = process.env.DB_AUTH_SOURCE || 'admin';
        const useSSL = process.env.DB_USE_SSL === 'true';
        const authMechanism = process.env.DB_AUTH_MECHANISM;

        let dbLink = process.env.MONGODB_URI || (user && password ? `mongodb://${user}:${password}@${host}:${port}/${dbName}` : `mongodb://${host}:${port}/${dbName}`);
        let queryParams = [];
        queryParams.push(`authSource=${authSource}`);
        if (useSSL) queryParams.push('ssl=true');
        if (authMechanism) queryParams.push(`authMechanism=${authMechanism}`);

        dbLink += '?' + queryParams.join('&');

        return dbLink;
    },

    connect: async function () {
        const dbLink = this.getMongoUri();

        console.log(`Connecting to DB at ${dbLink}...`);
        try {
            await mongoose.connect(dbLink);
            console.log('DB Connected.');
        } catch (error) {
            console.error('Connection error:', error);
        }

        return mongoose.connection;
    },

    disconnect: function () {
        if (mongoose.connection) {
            mongoose.connection.close();
        }
    }
};

export default db;
