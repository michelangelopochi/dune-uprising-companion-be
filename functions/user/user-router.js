const express = require('express');
const { authenticate } = require('../middlewares/auth-middleware');
const User = require('../models/user');

const router = express.Router();

router.get('/profile', authenticate, (req, res) => {
    var user = req.user;

    res.json({
        username: user.username,
        avatar: user.avatar,
        presets: user.presets
    });
});

router.get('/getAllUsers', authenticate, async (req, res) => {
    var user = req.user;

    const { _id } = req.user;

    const users = await User.find({ _id: { $ne: _id } }, 'username avatar -_id');

    res.json({
        users: users
    });
});

module.exports = router;