const express = require('express');
const path = require('path');
const { checkPermissions, checkDynamicPermissions } = require('../middleware/permissions');

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
const customModelRouter = require('./cms/custom-model-router');

// JSON API
const apiAuth = require('./api/auth');
const apiTag = require('./api/tags');
const apiFile = require('./api/files');
const apiPage = require('./api/pages');
const apiMenu = require('./api/menus');
const apiBlog = require('./api/blog');
const apiProducts = require('./api/products');
const apiSend = require('./api/send');
const apiMembers = require('./api/members');
const apiSitemap = require('./api/sitemap');
const apiCustom = require('./api/custom');

module.exports = (app) => {

    // protect static folder pubblic/css-assets/ with cmsAuthentication
    app.use('/cms-assets', cmsAuthentication, express.static(path.join(__dirname, '../../public/cms-assets')));

    // Serve other static files in public directory
    app.use(express.static(path.join(__dirname, '../../public')));

    // CMS
    app.use('/cms/login', cmsLogin)
    app.use('/cms/logout', cmsLogout);

    const cmsRoutes = express.Router();
    cmsRoutes.use(checkAuthentication);

    cmsRoutes.use('/', cmsIndex);
    cmsRoutes.use('/files', checkPermissions(['files']), cmsFiles);
    cmsRoutes.use('/tags', checkPermissions(['tags']), cmsTags);
    cmsRoutes.use('/customers', checkPermissions(['users']), cmsCustomers);
    cmsRoutes.use('/products', checkPermissions(['products']), cmsProducts);
    cmsRoutes.use('/orders', checkPermissions(['orders']), cmsOrders);
    cmsRoutes.use('/statuses', checkPermissions(['statuses']), cmsStatuses);
    cmsRoutes.use('/pages', checkPermissions(['pages']), cmsPages);
    cmsRoutes.use('/blog', checkPermissions(['blog']), cmsBlog);
    cmsRoutes.use('/notifications', checkPermissions(['notifications']), cmsNotifications);
    cmsRoutes.use('/email-templates', checkPermissions(['email_templates']), cmsEmails);
    cmsRoutes.use('/menus', checkPermissions(['menus']), cmsMenus);
    cmsRoutes.use('/team', checkPermissions(['team']), cmsTeam);
    cmsRoutes.use('/settings', checkPermissions(['settings']), cmsSettings);
    cmsRoutes.use('/update', checkPermissions(['updates']), cmsUpdate);

    // Custom Model Routes
    cmsRoutes.use('/custom', checkDynamicPermissions(['custom_models']), customModelRouter);

    app.use('/cms', cmsRoutes);

    // JSON API
    const apiRoutes = express.Router();

    // Apply authentication check to all API routes except '/auth'
    apiRoutes.use((req, res, next) => {
        if (req.path === '/auth/login' && req.method === 'POST') {
            next();
        } else {
            checkAPIAuthentication(req, res, next);
        }
    });

    apiRoutes.use('/auth', apiAuth);
    apiRoutes.use('/tags', checkPermissions(['tags']), apiTag);
    apiRoutes.use('/files', checkPermissions(['files']), apiFile);
    apiRoutes.use('/pages', checkPermissions(['pages']), apiPage);
    apiRoutes.use('/menus', checkPermissions(['menus']), apiMenu);
    apiRoutes.use('/blog', checkPermissions(['blog']), apiBlog);
    apiRoutes.use('/products', checkPermissions(['products']), apiProducts);
    apiRoutes.use('/send', checkPermissions(['send']), apiSend);
    apiRoutes.use('/members', checkPermissions(['team']), apiMembers);
    apiRoutes.use('/sitemap', checkPermissions(['sitemap']), apiSitemap);
    apiRoutes.use('/custom', checkPermissions(['custom_models']), apiCustom);

    app.use('/api', apiRoutes);

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

function checkAPIAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        console.log('Unauthorized');
        res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }
}

// Custom middleware to handle CMS static files and page requests
function cmsAuthentication(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(403).send('Access Denied');
    }
    next();
}