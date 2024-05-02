const express = require('express');
const { authenticate } = require('../middlewares/auth-middleware');
const { getUserTables, create, deleteTable, addUser, removeUser } = require('./controller/table-controller');

const router = express.Router();

router.get('/getUserTables', authenticate, getUserTables);

router.post('/create', authenticate, create);

router.post('/delete', authenticate, deleteTable);

router.post('/addUser', authenticate, addUser);

router.post('/removeUser', authenticate, removeUser);

module.exports = router;