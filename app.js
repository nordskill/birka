const path = require('path');
const express = require('express');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const logger = require('morgan');
const passport = require('passport');

const db = require('./functions/db-connect');
const loadVars = require('./functions/vars');
const loadData = require('./functions/data');
const loadIcons = require('./functions/load-icons');
const icon = require('./functions/icon');
const generateSvgSprites = require('./functions/generate-svg-sprites');
const formatDate = require('./functions/format-date');

const SiteSettings = require('./models/settings');
const File = require('./models/file');
const setupRoutes = require('./routes/_setup');
const OperationalError = require('./functions/operational-error');

init();

function init() {
    loadVars();
    loadData();
    db.connect();
    getSiteSettings();
    global.ico = loadIcons();
    global.svg_sprites = generateSvgSprites();
    global.formatDate = formatDate;
    setupApp();
}

async function getSiteSettings() {
    try {
        global.SS = await SiteSettings
            .findOne()
            .populate({
                path: 'social_links.icon',
                model: 'File',
                select: 'file_name mime_type extension'
            })
            .select('-_id -__v')
            .lean();

    } catch (error) {
        console.error("Error fetching site settings:", error);
    }
}

function setupApp() {
    const app = express();

    app.disable('x-powered-by');

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    app.locals.rmWhitespace = true;
    app.locals.icon = icon;

    setupMiddleware(app);
    setupRoutes(app);
    setupErrorHandler(app);

    module.exports = app;
}

function setupMiddleware(app) {

    app.use((req, res, next) => {
        res.locals.env = process.env.NODE_ENV;
        next();
    });
    
    app.use(express.json());
    app.use(express.urlencoded({
        extended: false
    }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(logger('dev'));

    app.set('trust proxy', 1);
    app.use(cookieSession({
        name: 'session',
        secret: process.env.SESSION_SECRET || 'super_very_secret',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    }));

    // Passport middleware
    app.use(passport.initialize());
    app.use(passport.session());
}

function setupErrorHandler(app) {
    // 404 Not Found Handler
    app.use((req, res, next) => {
        next(createError(404));
    });

    // General Error Handler
    app.use((err, req, res, next) => {

        res.status(err.status || 500);

        const isOperationalError = err instanceof OperationalError;
        const errorResponse = {
            message: isOperationalError ? err.message : 'Internal Server Error',
            error: req.app.get('env') === 'development' && !isOperationalError ? err : {}
        };

        // Check if the request is for the API or HTML
        if (req.originalUrl.startsWith('/api/')) {
            res.json({
                success: false,
                ...errorResponse
            });
        } else {
            res.render('error', {
                template_name: 'error',
                ...errorResponse
            });
        }
    });
}