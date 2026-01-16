const jwt = require('jsonwebtoken');
const db = require('../db');

// Protect routes -> Verify Token
exports.protect = async (req, res, next) => {
    let token;
    // 1) Getting token and check of it's there
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            status: 'fail',
            message: 'You are not logged in! Please log in to get access.'
        });
    }

    // 2) Verification token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');

        // 3) Check if user still exists

        const [rows] = await db.execute('SELECT id, role, email FROM users WHERE id = ?', [decoded.id]);

        if (rows.length === 0) {
            return res.status(401).json({
                status: 'fail',
                message: 'The user belonging to this token does no longer exist.'
            });
        }

        const currentUser = rows[0];
        req.user = currentUser;
        next();
    } catch (err) {
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid token'
        });
    }
};

// Optional Auth - attach user if token exists, but don't error if not
exports.optionalProtect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        const [rows] = await db.execute('SELECT id, role, email FROM users WHERE id = ?', [decoded.id]);

        if (rows.length > 0) {
            req.user = rows[0];
        }
        next();
    } catch (err) {
        // If token is invalid (expired, etc), just proceed as guest
        next();
    }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};
