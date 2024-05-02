const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../user');

const tableDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "tables");

const GameSchema = new mongoose.Schema(
    {
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: User }]
    }
);

const Game = tableDB.model('Game', GameSchema);

module.exports = Game;