const mongoose = require('mongoose');

module.exports = {
    connect: function () {
        const host = process.env.DB_HOST || '127.0.0.1';
        const port = process.env.DB_PORT || 27017;
        const dbName = process.env.DB_NAME || 'birka';
        const user = process.env.DB_USER;
        const password = process.env.DB_PASSWORD;
        const authSource = process.env.DB_AUTH_SOURCE || 'admin';
        const useSSL = process.env.DB_USE_SSL === 'true';
        const authMechanism = process.env.DB_AUTH_MECHANISM;

        let dbLink = user && password ? `mongodb://${user}:${password}@${host}:${port}/${dbName}` : `mongodb://${host}:${port}/${dbName}`;

        let queryParams = [];
        queryParams.push(`authSource=${authSource}`);
        if (useSSL) queryParams.push('ssl=true');
        if (authMechanism) queryParams.push(`authMechanism=${authMechanism}`);

        // Append query parameters to the URI
        dbLink += '?' + queryParams.join('&');

        console.log(`Connecting to "${dbName}" DB...`);
        mongoose.connect(dbLink)
        .then(() => console.log('DB Connected.'))
        .catch(error => console.error('Connection error:', error));

        module.exports.connection = mongoose.connection;
    },
    disconnect: function () {
        if (mongoose.connection) {
            mongoose.connection.close();
        }
    }
}
