function checkPermissions(requiredPermissions) {
    return function (req, res, next) {
        const userPermissions = req.user.permissions || [];
        const hasPermission = requiredPermissions.every(permission => userPermissions.includes(permission));
        if (!hasPermission) {
            return res.status(403).json({ message: 'Access Denied' });
        }
        next();
    };
}

// New function to handle dynamic model permissions
function checkDynamicPermissions(permissionKey) {
    return function (req, res, next) {
        const userPermissions = req.user.permissions || [];
        if (!userPermissions.includes(permissionKey)) {
            return res.status(403).json({ message: 'Access Denied' });
        }
        next();
    };
}

module.exports = {
    checkPermissions,
    checkDynamicPermissions
};