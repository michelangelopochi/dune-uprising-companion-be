const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../user');

const tableDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "tables");

const StatSchema = new mongoose.Schema(
    {
        name: { type: String, required: false } //TODO
    }
);

const Stat = tableDB.model('Stat', StatSchema);

module.exports = Stat;