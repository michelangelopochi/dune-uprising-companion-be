const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../user');
const Game = require('./game');
const Stat = require('./stat');

const tableDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "tables");

const TableSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: User },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: User }],
        games: [{ type: mongoose.Schema.Types.ObjectId, ref: Game }],
        stats: { type: mongoose.Schema.Types.ObjectId, ref: Stat },
        key: { type: String, required: true },
        gameRunning: { type: String, default: "" }
    }
);

const Table = tableDB.model('Table', TableSchema);

module.exports = Table;