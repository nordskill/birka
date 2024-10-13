import cache from '../utils/cache.js';

function cacheMiddleware(req, res, next) {
    const key = '__express__' + req.originalUrl || req.url;
    const cachedBody = cache.get(key);

    if (cachedBody) {
        res.send(cachedBody);
    } else {
        const originalSend = res.send.bind(res);
        res.send = (body) => {
            cache.set(key, body);
            originalSend(body);
        };
        next();
    }
}

export default cacheMiddleware;