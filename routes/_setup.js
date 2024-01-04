// Navigation
const index = require('./index');
const users = require('./users');

// CMS
const cmsIndex = require('./cms/index');
const cmsFiles = require('./cms/files');
const cmsTags = require('./cms/tags');
const cmsCustomers = require('./cms/customers');
const cmsProducts = require('./cms/products');
const cmsOrders = require('./cms/orders');
const cmsStatuses = require('./cms/statuses');
const cmsPages = require('./cms/pages');
const cmsBlog = require('./cms/blog');
const cmsNotifications = require('./cms/notifications');
const cmsEmails = require('./cms/email-templates');
const cmsSettings = require('./cms/settings');

// JSON API
const apiTag = require('./api/tags');
const apiFile = require('./api/files');

module.exports = (app) => {

    // Navigation
    app.use('/', index);
    app.use('/users', users);

    // CMS
    app.use('/cms', cmsIndex);
    app.use('/cms/files', cmsFiles);
    app.use('/cms/tags', cmsTags);
    app.use('/cms/customers', cmsCustomers);
    app.use('/cms/products', cmsProducts);
    app.use('/cms/orders', cmsOrders);
    app.use('/cms/statuses', cmsStatuses);
    app.use('/cms/pages', cmsPages);
    app.use('/cms/blog', cmsBlog);
    app.use('/cms/notifications', cmsNotifications);
    app.use('/cms/email-templates', cmsEmails);
    app.use('/cms/settings', cmsSettings);

    // JSON API
    app.use('/api/tags', apiTag);
    app.use('/api/files', apiFile);
    
};