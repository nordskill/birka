class OperationalError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
        this.isOperational = true;
    }
}

module.exports = OperationalError;