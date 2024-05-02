const express = require('express');
const { authenticate } = require('../middlewares/auth-middleware');
const { getGameCards, create, addGuest, joinGame, addCard, removeCard, endGame } = require('./controller/game-controller');

const router = express.Router();

router.post('/create', authenticate, create);

router.get('/getGameCards', authenticate, getGameCards);

router.post('/addGuest', authenticate, addGuest);

router.post('/join', authenticate, joinGame);

router.post('/addCard', authenticate, addCard);

router.post('/removeCard', authenticate, removeCard);

router.post('/endGame', authenticate, endGame);

module.exports = router;