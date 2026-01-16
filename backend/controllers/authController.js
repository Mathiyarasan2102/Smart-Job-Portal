const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret', {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });
};

exports.register = async (req, res) => {
    try {
        const { email, password, role, first_name, last_name } = req.body;

        // Validation
        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Please provide email, password and role' });
        }

        if (!['candidate', 'recruiter'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Check if user exists
        const [existing] = await db.execute('SELECT email FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12); // Cost factor 12 (trade-off: slower but more secure)
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert
        const [result] = await db.execute(
            'INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, role, first_name, last_name]
        );

        const token = signToken(result.insertId);

        // Remove password from output
        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: { id: result.insertId, email, role, first_name, last_name }
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Select password explicitly
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Incorrect email or password' });
        }

        const user = rows[0];
        const isCorrect = await bcrypt.compare(password, user.password_hash);

        if (!isCorrect) {
            return res.status(401).json({ message: 'Incorrect email or password' });
        }

        const token = signToken(user.id);

        // Remove password from response
        delete user.password_hash;

        res.status(200).json({
            status: 'success',
            token,
            data: { user }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
