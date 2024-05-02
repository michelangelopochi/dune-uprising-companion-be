const express = require('express');
const { authenticate } = require('../middlewares/auth-middleware');

const router = express.Router();

router.get('/profile', authenticate, (req, res) => {
    var user = req.user;

    res.json({
        username: user.username,
        avatar: user.avatar,
        presets: user.presets
    });
});

module.exports = router;