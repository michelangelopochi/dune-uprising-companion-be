import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.js";
import Preset from "../models/preset.js";
import Search from "../models/search.js";
import { connectDB } from "../utils/db.js";

dotenv.config();

export async function authenticate(req, res, next) {
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