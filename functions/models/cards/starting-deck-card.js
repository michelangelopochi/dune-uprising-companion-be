import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const cardsDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "cards");

const startingDeckCardSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        tags: [{ type: String, required: false, select: false }],
        price: { type: Number, required: false, select: false },
        acquiredBonuses: [{ type: mongoose.Schema.Types.Mixed, required: false, select: false }],
        symbols: [{ type: String, required: false, select: false }],
        revelation: [{ type: mongoose.Schema.Types.Mixed, required: false, select: false }],
        discardedBonuses: [{ type: mongoose.Schema.Types.Mixed, required: false, select: false }],
        givesVP: { type: Boolean, required: true, default: false, select: false },
        img: { type: String, required: true, default: '' },
        persuasion: { type: Number, required: false, select: false },
        swords: { type: Number, required: false, select: false },
        trashedBonuses: [{ type: mongoose.Schema.Types.Mixed, required: false, select: false }],
        type: { type: String, required: true, select: false },
        effects: [{ type: mongoose.Schema.Types.Mixed, required: false, select: false }],
        copy: { type: Number, required: true, default: 1 }
    },
    { timestamps: false }
);

const StartingDeckCard = cardsDB.model('StartingDeckCard', startingDeckCardSchema, 'starting_deck');

export default StartingDeckCard;