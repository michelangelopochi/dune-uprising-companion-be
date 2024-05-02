const express = require('express');
const { authenticate } = require('../middlewares/auth-middleware');
const { save, removePreset, loadPreset } = require('./controller/preset-controller');

const router = express.Router();

router.post('/save', authenticate, save);

router.post('/load', authenticate, loadPreset);

router.post('/delete', authenticate, removePreset);

module.exports = router;