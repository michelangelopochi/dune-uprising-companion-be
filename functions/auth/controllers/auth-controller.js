const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../models/user');
require('dotenv').config();

// Register a new user
const register = async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.json({ message: 'Registration successful' });
    } catch (error) {
        if (error.code === 11000) {
            error.message = 'Username or email already exists';
            res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

// Login with an existing user
const login = async (req, res, next) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'Username or password invalid' });
        }

        const passwordMatch = await user.comparePassword(password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Username or password invalid' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.SECRET_JWT_KEY, { expiresIn: process.env.JWT_EXPIRATION });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.SECRET_JWT_KEY, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

        res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' }).json({ token });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login };