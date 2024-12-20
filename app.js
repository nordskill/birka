import fs from 'fs';
import path from 'path';
import express from 'express';
import expressSession from 'express-session';
import MongoStore from 'connect-mongo';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

import db from './core/functions/db-connect.js';
import points from './core/functions/points.js';
import packageJson from './package.json' assert { type: 'json' };
import loadVars from './core/functions/vars.js';
import loadData from './core/functions/data.js';
import loadIcons from './core/functions/load-icons.js';
import icon from './core/functions/icon.js';
import getData from './core/functions/get-data.js';
import getField from './core/functions/get-field.js';
import getImgTag from './core/functions/get-img-tag.js';
import generateSvgSprites from './core/functions/generate-svg-sprites.js';
import formatDate from './core/functions/format-date.js';
import loadMenus from './core/functions/menus.js';

import SiteSettings from './core/models/settings.js';
import setupRoutes from './core/routes/_setup.js';
import OperationalError from './core/functions/operational-error.js';
import { deepFreeze } from './core/functions/deep-freeze.js';

import cache from './core/utils/cache.js';

import {
    loadModels,
    getAllSubmodels,
    getSubmodels,
    getCustomModel,
    getModelNameBySlug,
} from './core/functions/model-loader.js';

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const mongoUri = db.getMongoUri();

// Object to track exceeded request counts and initial exceedance flag per IP
let exceededRequests = {};

async function init() {
    loadVars();
    loadData();
    await db.connect();
    const siteSettings = await getGlobalSettings();
    global.ico = loadIcons();
    global.svg_sprites = generateSvgSprites();
    global.formatDate = formatDate;
    return await setupApp(siteSettings);
}

async function getGlobalSettings() {
    try {
        let globalSettings = cache.get('GlobalSettings');
        let immutableSettings = globalSettings;

        if (!globalSettings) {
            globalSettings = await SiteSettings.findOne().populate('logo').lean();

            immutableSettings = deepFreeze(globalSettings);
            cache.set('GlobalSettings', immutableSettings);
        }

        registerModels();
        return immutableSettings;
    } catch (error) {
        console.error('Error fetching site settings:', error);
    }
}

function registerModels() {
    const gs = cache.get('GlobalSettings');
    const customModelPath = path.join(__dirname, `./custom/${gs.skin}/models`);
    const { coreModels, customModels, subModels } = loadModels(customModelPath);

    global.coreModels = coreModels;
    global.customModels = customModels;
    global.subModels = subModels;

    console.log('Custom Models:', Object.keys(customModels));
    console.log('Custom Sub Models:', Object.keys(subModels));
}

async function setupApp(siteSettings) {
    const app = express();

    await loadPlugins(app);

    app.disable('x-powered-by');

    app.locals.GlobalSettings = siteSettings;
    app.locals.rmWhitespace = true;
    app.locals.icon = icon;

    points.emit('middleware:before', app);
    await setupMiddleware(app);
    points.emit('middleware:after', app);

    points.emit('routes:before', app);
    setupRoutes(app, siteSettings);
    points.emit('routes:after', app);

    setupErrorHandler(app);

    return app;
}

async function setupMiddleware(app) {
    // Write logs to file
    const logDirectory = path.join(__dirname, 'logs');
    // Ensure log directory exists, if it doesn't, create one
    fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
    // If 'access.log' does not exist—create one
    fs.existsSync(path.join(logDirectory, 'access.log')) ||
        fs.writeFileSync(path.join(logDirectory, 'access.log'), '');
    const accessLogStream = fs.createWriteStream(
        path.join(logDirectory, 'access.log'),
        { flags: 'a' }
    );

    app.set('view engine', 'ejs');
    app.use(skinSetter);

    app.use((req, res, next) => {
        res.locals.env = process.env.NODE_ENV;
        res.locals.getImgTag = getImgTag;
        res.locals.getData = getData;
        res.locals.getField = getField;
        next();
    });

    app.use(express.json());
    app.use(
        express.urlencoded({
            extended: false,
        })
    );
    app.use(cookieParser());
    app.use(loadMenus);

    if (process.env.NODE_ENV === 'production') {
        app.use(
            logger('combined', {
                stream: accessLogStream,
                skip: function (req, res) {
                    return res.statusCode < 400;
                },
            })
        );
    } else {
        app.use(logger('dev'));
    }

    setInterval(() => {
        for (const [ip, data] of Object.entries(exceededRequests)) {
            if (data.count > 0) {
                const logMessage = `${new Date().toISOString()} - ${data.count
                    } requests during the last 10 sec. from IP: ${ip}\n`;
                fs.appendFileSync(
                    path.join(__dirname, 'logs', 'access.log'),
                    logMessage
                );
                data.count = 0;
            } else {
                delete exceededRequests[ip];
            }
        }
    }, 3000); // 3 seconds

    const limiter = rateLimit({
        windowMs: 30 * 1000, // 30 seconds
        max: 3000, // limit each IP to 3000 requests per windowMs
        handler: function (req, res) {
            const ip = req.ip;
            if (!exceededRequests[ip] || !exceededRequests[ip].logged) {
                let message = `Rate limit exceeded for IP: ${ip} on path: ${req.path}`;
                exceededRequests[ip] = { count: 1, logged: true };
                console.error(message);
                fs.appendFileSync(
                    path.join(__dirname, 'logs', 'access.log'),
                    `${new Date().toISOString()} - ${message}\n`
                );
            } else {
                exceededRequests[ip].count += 1;
            }
            res
                .status(429)
                .json({ message: 'Too many requests, please try again later.' });
        },
        onLimitRemoved: function (req, res) {
            const ip = req.ip;
            delete exceededRequests[ip];
        },
    });

    // Apply the rate limiting middleware to all requests
    app.use(limiter);

    // Cookie Session Setup
    app.set('trust proxy', 1);
    app.use(
        expressSession({
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({
                mongoUrl: mongoUri, // Use the MongoDB URI directly here
                mongooseConnection: db.connection, // Optionally pass the connection object if needed
                collection: 'sessions',
            }),
            cookie: {
                sameSite: 'lax',
                secure:
                    process.env.NODE_ENV === 'production' &&
                    process.env.PRODUCTION_TEST !== 'true',
                httpOnly: true,
            },
        })
    );

    app.use((req, res, next) => {
        const pathsToIgnore = ['/cms', '/dev', '/cms-assets'];
        if (pathsToIgnore.some((path) => req.path.startsWith(path))) {
            next();
        } else {
            res.locals.cookies_consent = req.session.hasOwnProperty(
                'cookies_consent'
            )
                ? req.session.cookies_consent
                : undefined;
            next();
        }
    });

    app.use(csrfToken);
    app.use(csrfProtection);

    // Passport middleware
    app.use(passport.initialize());
    app.use(passport.session());

    // Attach user data to res.locals
    app.use((req, res, next) => {
        res.locals.auth_user = req.user;
        res.locals.project_version = packageJson.version;
        next();
    });

    function skinSetter(req, res, next) {
        app.set('views', [
            path.join(__dirname, `custom/${app.locals.GlobalSettings.skin}/views`),
            path.join(__dirname, 'core/views'),
        ]);
        next();
    }
}

export default (async () => {
    try {
        const app = await init();
        return app;
    } catch (error) {
        console.error('Failed to initialize app:', error);
        process.exit(1);
    }
})();

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
            message: err.message,
            error:
                req.app.get('env') === 'development' && !isOperationalError ? err : {},
        };

        // Check if the request is for the API or HTML
        if (req.originalUrl.startsWith('/api/')) {
            res.json({
                success: false,
                ...errorResponse,
            });
        } else {
            res.render(
                path.join(__dirname, 'core/views/error.ejs'),
                {
                    template_name: 'error',
                    ...errorResponse,
                }
            );
        }
    });
}

function csrfToken(req, res, next) {
    if (!req.session.csrfToken) regenerateToken();
    res.locals.csrf_token = req.session.csrfToken;
    next();

    function regenerateToken() {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
        req.session.save();
    }
}

function csrfProtection(req, res, next) {

    const { method, path, ip, headers, query, body, rawBody } = req;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return next();
    }

    const getTokenFromMultipart = () => {
        if (req.is('multipart/form-data') && rawBody) {
            const bodyString = rawBody.toString();
            const csrfMatch = bodyString.match(/_csrf=([^&\n]+)/);
            return csrfMatch ? decodeURIComponent(csrfMatch[1]) : null;
        }
        return null;
    };

    const clientCsrfToken = headers['x-csrf-token'] ?? query?._csrf ?? body?._csrf ?? getTokenFromMultipart();

    if (!clientCsrfToken) {
        console.error(`No CSRF token found for request on ${path} from IP: ${ip}`);
        return next(new OperationalError('CSRF token missing', 403));
    }

    if (req.session.csrfToken !== clientCsrfToken) {
        console.error(`CSRF token mismatch for request on ${path} from IP: ${ip}`);
        return next(new OperationalError('CSRF token mismatch', 403));
    }
    next();
}

async function loadPlugins(app) {
    const pluginsPath = path.join(__dirname, 'plugins');

    if (!fs.existsSync(pluginsPath)) {
        console.warn(`Plugins directory not found at ${pluginsPath}`);
        return;
    }

    const plugins = fs.readdirSync(pluginsPath);

    for (const plugin of plugins) {
        const pluginPath = path.join(pluginsPath, plugin);
        const pluginIndex = path.join(pluginPath, 'index.js');

        if (fs.existsSync(pluginIndex)) {
            try {
                await import(pathToFileURL(pluginIndex).href);
                console.log(`Plugin loaded: ${plugin}`);
            } catch (error) {
                console.error(`Error loading plugin ${plugin}:`, error.message);
            }
        } else {
            console.warn(`No index.js found for plugin: ${plugin}`);
        }
    }
}
