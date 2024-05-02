const mongoose = require('mongoose');
require('dotenv').config();

const cardsDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "cards");

const searchSchema = new mongoose.Schema(
    {
        filters: { type: String, required: true },
        key: { type: String, required: true },
        firstSearch: { type: Date, required: true },
        lastSearch: { type: Date, required: true },
        thisWeek: { type: Number, required: true },
        total: { type: Number, required: true },
    }
);

const Search = cardsDB.model('Search', searchSchema);

module.exports = Search;