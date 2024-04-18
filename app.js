const fs = require('fs');
const path = require('path');
const express = require('express');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const db = require('./functions/db-connect');
const packageJson = require('./package.json');
const loadVars = require('./functions/vars');
const loadData = require('./functions/data');
const loadIcons = require('./functions/load-icons');
const icon = require('./functions/icon');
const generateSvgSprites = require('./functions/generate-svg-sprites');
const formatDate = require('./functions/format-date');
const loadMenus = require('./functions/menus');

const SiteSettings = require('./models/settings');
const setupRoutes = require('./routes/_setup');
const OperationalError = require('./functions/operational-error');

// Object to track exceeded request counts and initial exceedance flag per IP
let exceededRequests = {};

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
                path: 'social_links.icon logo',
                model: 'File'
            })
            .lean();

    } catch (error) {
        console.error("Error fetching site settings:", error);
    }
}

function setupApp() {
    const app = express();

    app.disable('x-powered-by');

    app.locals.rmWhitespace = true;
    app.locals.icon = icon;

    setupMiddleware(app);
    setupRoutes(app);
    setupErrorHandler(app);

    module.exports = app;
}

async function setupMiddleware(app) {

    // write logs to file
    const logDirectory = path.join(__dirname, 'logs');
    // ensure log directory exists, if it doesn't, create one
    fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
    // if 'access.log' does not exist—create one
    fs.existsSync(path.join(logDirectory, 'access.log')) || fs.writeFileSync(path.join(logDirectory, 'access.log'), '');
    const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });

    app.set('view engine', 'ejs');
    app.use(skinSetter);

    app.use((req, res, next) => {
        res.locals.env = process.env.NODE_ENV;
        next();
    });

    app.use(express.json());
    app.use(express.urlencoded({
        extended: false
    }));
    app.use(cookieParser());
    app.use(loadMenus);

    if (process.env.NODE_ENV === 'production') {
        app.use(logger('combined', {
            stream: accessLogStream,
            skip: function (req, res) { return res.statusCode < 400 }
        }));
    } else {
        app.use(logger('dev'));
    }

    setInterval(() => {
        for (const [ip, data] of Object.entries(exceededRequests)) {
            if (data.count > 0) {
                const logMessage = `${new Date().toISOString()} - ${data.count} requests during the last 10 sec. from IP: ${ip}\n`;
                fs.appendFileSync(path.join(__dirname, 'logs', 'access.log'), logMessage);
                data.count = 0;
            } else {
                delete exceededRequests[ip];
            }
        }
    }, 3000); // 10 seconds

    const limiter = rateLimit({
        windowMs: 30 * 1000, // 30 seconds
        max: 3000, // limit each IP to 3000 requests per windowMs
        handler: function (req, res) {
            const ip = req.ip;
            if (!exceededRequests[ip] || !exceededRequests[ip].logged) {
                let message = `Rate limit exceeded for IP: ${ip} on path: ${req.path}`;
                exceededRequests[ip] = { count: 1, logged: true };
                console.error(message);
                fs.appendFileSync(path.join(__dirname, 'logs', 'access.log'), `${new Date().toISOString()} - ${message}\n`);
            } else {
                exceededRequests[ip].count += 1;
            }
            res.status(429).json({ message: "Too many requests, please try again later." });
        },
        onLimitRemoved: function (req, res) {
            const ip = req.ip;
            delete exceededRequests[ip];
        }
    });

    // Apply the rate limiting middleware to all requests
    app.use(limiter);

    // Cookie Session Setup
    app.set('trust proxy', 1);
    app.use(expressSession({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: db.connection.client.s.url,
            mongooseConnection: db.connection,
            collection: 'sessions'
        }),
        cookie: {
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production' && process.env.PRODUCTION_TEST !== 'true',
            httpOnly: true
        }
    }));

    app.use((req, res, next) => {
        const pathsToIgnore = ['/cms', '/dev', '/cms-assets'];
        if (pathsToIgnore.some(path => req.path.startsWith(path))) {
            next();
        } else {
            res.locals.cookies_consent = req.session.hasOwnProperty('cookies_consent') ? req.session.cookies_consent : undefined;
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
            path.join(__dirname, `skins/${SS.skin}/views`),
            path.join(__dirname, 'views')
        ]);
        next();
    }

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
            // message: isOperationalError ? err.message : 'Internal Server Error',
            message: err.message,
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

function csrfToken(req, res, next) {

    if (!req.session.csrfToken) regenerateToken();
    res.locals.csrf_token = req.session.csrfToken;
    next();

    function regenerateToken() {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
        req.session.save();
    };
}

function csrfProtection(req, res, next) {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const clientCsrfToken = req.body._csrf || req.query._csrf || req.headers['x-csrf-token'];
        if (!clientCsrfToken || req.session.csrfToken !== clientCsrfToken) {
            console.error(`CSRF token mismatch for request on ${req.path} from IP: ${req.ip}`);
            const error = new OperationalError('CSRF token mismatch', 403);
            return next(error);
        }
    }
    next();
}