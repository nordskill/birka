# Project "Birka"

eCommerce platform.

## Error Handling

in app.js:

```js
const OperationalError = require('./functions/operational-error');

// ...

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
```

operational-error.js:

```js
class OperationalError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
        this.isOperational = true;
    }
}

module.exports = OperationalError;
```

### Example of Usage

1. import OperationalError module from `[project-root]/functions/operational-error`;
2. Inside of a try/catch: `throw new OperationalError(`Not found.`, 404);`
3. Outside of try/catch: `return next(new OperationalError('Not found.', 404));`
4. Use only for operational errors, in the cases when you expect from user to make a certain mistake at the current point.

### Ideas

- create new theme generator with q-a logic
- name of folder ==== package.json.name
