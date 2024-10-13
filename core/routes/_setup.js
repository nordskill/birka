// Import core modules
import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Import middleware
import { checkPermissions, checkDynamicPermissions } from '../middleware/permissions.js';

// Import Navigation Routes
import index from './index.js';
import blog from './blog.js';
import cookies from './cookies.js';

// Import CMS Routes
import cmsIndex from './cms/index.js';
import cmsLogin from './cms/login.js';
import cmsLogout from './cms/logout.js';
import cmsFiles from './cms/files.js';
import cmsTags from './cms/tags.js';
import cmsCustomers from './cms/customers.js';
import cmsProducts from './cms/products.js';
import cmsOrders from './cms/orders.js';
import cmsStatuses from './cms/statuses.js';
import cmsPages from './cms/pages.js';
import cmsBlog from './cms/blog.js';
import cmsNotifications from './cms/notifications.js';
import cmsEmails from './cms/email-templates.js';
import cmsMenus from './cms/menus.js';
import cmsTeam from './cms/team.js';
import cmsSettings from './cms/settings.js';
import cmsUpdate from './cms/update.js';
import customModelRouter from './cms/custom-model-router.js';

// Import JSON API Routes
import apiAuth from './api/auth.js';
import apiTag from './api/tags.js';
import apiFile from './api/files.js';
import apiPage from './api/pages.js';
import apiMenu from './api/menus.js';
import apiBlog from './api/blog.js';
import apiProducts from './api/products.js';
import apiSend from './api/send.js';
import apiMembers from './api/members.js';
import apiSitemap from './api/sitemap.js';
import apiCustom from './api/custom.js';

// __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main function to set up routes and middleware.
 * @param {express.Application} app - The Express application instance.
 * @param {Object} GlobalSettings - Global settings object.
 */
export default (app, GlobalSettings) => {

    // Protect static folder public/cms-assets/ with cmsAuthentication
    app.use(
        '/cms-assets',
        cmsAuthentication,
        express.static(path.join(__dirname, '../../public/cms-assets'))
    );

    // Serve other static files in public directory
    app.use(express.static(path.join(__dirname, '../../public')));

    // CMS Authentication Routes
    app.use('/cms/login', cmsLogin);
    app.use('/cms/logout', cmsLogout);

    // CMS Router with authentication
    const cmsRoutes = express.Router();
    cmsRoutes.use(checkAuthentication);

    // Define CMS routes with permission checks
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

    // Custom Model Routes with dynamic permissions
    cmsRoutes.use('/custom', checkDynamicPermissions(['custom_models']), customModelRouter);

    // Mount CMS routes
    app.use('/cms', cmsRoutes);

    // JSON API Router
    const apiRoutes = express.Router();

    // Apply authentication check to all API routes except '/auth/login' POST
    apiRoutes.use((req, res, next) => {
        if (req.path === '/auth/login' && req.method === 'POST') {
            return next();
        }
        return checkAPIAuthentication(req, res, next);
    });

    // Define API routes with permission checks
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

    // Mount API routes
    app.use('/api', apiRoutes);

    // Navigation Routes
    app.use(`/${GlobalSettings.blog_slug}`, blog);
    app.use('/cookies', cookies);
    app.use('/', index);
};

/**
 * Middleware to check if the user is authenticated for CMS routes.
 * Redirects to '/cms/login' if not authenticated.
 */
function checkAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect('/cms/login');
}

/**
 * Middleware to check if the user is authenticated for API routes.
 * Sends a 401 Unauthorized response if not authenticated.
 */
function checkAPIAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    console.log('Unauthorized');
    return res.status(401).json({
        success: false,
        message: 'Unauthorized'
    });
}

/**
 * Middleware to protect CMS static files.
 * Sends a 403 Forbidden response if not authenticated.
 */
function cmsAuthentication(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(403).send('Access Denied');
    }
    return next();
}