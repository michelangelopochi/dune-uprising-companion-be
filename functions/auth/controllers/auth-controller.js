import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { logger } from '../../utils/logger.js';
import User from "../../models/user.js";

dotenv.config();

// Register a new user
export async function register(req, res, next) {
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
export async function login(req, res, next) {
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

export async function forgotPassword(req, res, next) {
    const { username, email } = req.body;

    try {
        var user = await User.findOne({ username, email });
        if (!user) {
            return res.status(400).json({ message: 'User with this email does not exist' });
        }

        const token = encodeURI(await bcrypt.hash(user.password, 10));
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        const transporter = nodemailer.createTransport({
            host: process.env.MAILER_HOST,
            port: 587,
            secure: false, // use TLS
            // port: 465,
            // secure: true,
            auth: {
                user: process.env.MAILER_USER,
                pass: process.env.MAILER_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            to: user.email,
            from: 'noreply@duneuprisingcompanion.it',
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n

            https://duneuprisingcompanion.it/auth/reset-password/?token=${token}\n\n

            If you did not request this, please ignore this email and your password will remain unchanged.`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'A reset link has been sent to your email address' });
    } catch (error) {
        next(error);
    }
};

export async function getPasswordResetToken(req, res, next) {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.query.token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        res.status(200).json({ token: req.query.token });
    } catch (error) {
        next(error);
    }
};

export async function resetPassword(req, res, next) {
    const { password, token } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ token: req.params.token });
    } catch (error) {
        next(error);
    }
};

export async function changePassword(req, res, next) {
    const { username } = req.user;
    const { newPassword, newPasswordConfirm } = req.body;

    try {
        if (!newPassword || !newPasswordConfirm) {
            return res.status(400).json({ message: 'Invalid params' });
        }

        if (newPassword !== newPasswordConfirm) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        var updatedUser = await User.findOne({ username: username });

        if (!updatedUser) {
            return res.status(400).json({ message: 'User not found' });
        }

        updatedUser.password = await bcrypt.hash(newPassword, 10);
        await updatedUser.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};