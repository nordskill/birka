const express = require('express');
const path = require('path');

// Navigation
const index = require('./index');
const cookies = require('./cookies');

// CMS
const cmsIndex = require('./cms/index');
const cmsLogin = require('./cms/login');
const cmsLogout = require('./cms/logout');
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
const cmsMenus = require('./cms/menus');
const cmsTeam = require('./cms/team');
const cmsSettings = require('./cms/settings');
const cmsUpdate = require('./cms/update');

// JSON API
const apiAuth = require('./api/auth');
const apiTag = require('./api/tags');
const apiFile = require('./api/files');
const apiPage = require('./api/pages');
const apiMenu = require('./api/menus');
const apiBlog = require('./api/blog');
const apiSitemap = require('./api/sitemap');

module.exports = (app) => {

    // protect static folder pubblic/css-assets/ with cmsAuthentication
    app.use('/cms-assets', cmsAuthentication, express.static(path.join(__dirname, '../public/cms-assets')));

    // Serve other static files in public directory
    app.use(express.static(path.join(__dirname, '../public')));

    // CMS
    app.use('/cms/login', cmsLogin)
    app.use('/cms/logout', cmsLogout);

    const cmsRoutes = express.Router();
    cmsRoutes.use(checkAuthentication);

    cmsRoutes.use('/', cmsIndex);
    cmsRoutes.use('/files', cmsFiles);
    cmsRoutes.use('/tags', cmsTags);
    cmsRoutes.use('/customers', cmsCustomers);
    cmsRoutes.use('/products', cmsProducts);
    cmsRoutes.use('/orders', cmsOrders);
    cmsRoutes.use('/statuses', cmsStatuses);
    cmsRoutes.use('/pages', cmsPages);
    cmsRoutes.use('/blog', cmsBlog);
    cmsRoutes.use('/notifications', cmsNotifications);
    cmsRoutes.use('/email-templates', cmsEmails);
    cmsRoutes.use('/menus', cmsMenus);
    cmsRoutes.use('/team', cmsTeam);
    cmsRoutes.use('/settings', cmsSettings);
    cmsRoutes.use('/update', cmsUpdate);

    app.use('/cms', cmsRoutes);

    // JSON API
    app.use('/api/auth', apiAuth);
    app.use('/api/tags', apiTag);
    app.use('/api/files', apiFile);
    app.use('/api/pages', apiPage);
    app.use('/api/menus', apiMenu);
    app.use('/api/blog', apiBlog);
    app.use('/api/sitemap', apiSitemap);

    // Navigation
    app.use('/', index);
    app.use('/cookies', cookies);

};

function checkAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/cms/login');
    }
}

// Custom middleware to handle CMS static files and page requests
function cmsAuthentication(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(403).send('Access Denied');
    }
    next();
}