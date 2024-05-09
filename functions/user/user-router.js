import express from 'express';
import { authenticate } from "../middlewares/auth-middleware.js";
import User from "../models/user.js";

const userRouter = express.Router();

userRouter.get('/profile', authenticate, (req, res) => {
    var user = req.user;

    res.json({
        username: user.username,
        avatar: user.avatar,
        presets: user.presets
    });
});

userRouter.get('/getAllUsers', authenticate, async (req, res) => {
    var user = req.user;

    const { _id } = req.user;

    const users = await User.find({ _id: { $ne: _id } }, 'username avatar -_id');

    res.json({
        users: users
    });
});

export default userRouter;