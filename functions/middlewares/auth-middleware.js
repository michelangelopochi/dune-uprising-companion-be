const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Preset = require('../models/preset');
const Search = require('../models/search');
const { connectDB, disconnectDB } = require('../utils/db');
require('dotenv').config();

const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    const refreshToken = req.cookies['refreshToken'];

    if (!token && !refreshToken) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {

        const decodedToken = jwt.verify(token, process.env.SECRET_JWT_KEY);
        const user = await User.findById(decodedToken.userId, '-password')
            .populate({ path: 'presets', model: Preset, options: { collation: { 'locale': 'en' }, sort: { 'name': 1 } }, select: 'name key -_id' });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        if (!refreshToken) {
            return res.status(401).json({ message: 'Access Denied. No refresh token provided.' });
        }

        try {
            const decoded = jwt.verify(refreshToken, process.env.SECRET_JWT_KEY);
            const token = jwt.sign({ userId: decoded.userId }, process.env.SECRET_JWT_KEY, { expiresIn: process.env.JWT_EXPIRATION });

            res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' }).status(401).json({ token });
        } catch (error) {
            res.status(401).json({ message: 'Invalid token' });
        }
    }
};

module.exports = { authenticate };