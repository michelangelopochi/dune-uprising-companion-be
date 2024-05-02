const mongoose = require('mongoose');
require('dotenv').config();

const cardsDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "cards");

const intrigueCardSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        givesVP: { type: Boolean, required: true, default: false },
        img: { type: String, required: true, default: '' },
        type: { type: String, required: true },
        effects: [{ type: mongoose.Schema.Types.Mixed, required: false }],
        phaseNumber: { type: Number, required: true },
        phases: [{ type: String, required: false }]
    },
    { timestamps: false }
);

const IntrigueCard = cardsDB.model('IntrigueCard', intrigueCardSchema, 'intrigue');

module.exports = IntrigueCard;