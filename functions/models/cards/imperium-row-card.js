import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const cardsDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "cards");

const imperiumRowCardSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        tags: [{ type: String, required: false }],
        price: { type: Number, required: false },
        acquiredBonuses: [{ type: mongoose.Schema.Types.Mixed, required: false }],
        symbols: [{ type: String, required: false }],
        revelation: [{ type: mongoose.Schema.Types.Mixed, required: false }],
        discardedBonuses: [{ type: mongoose.Schema.Types.Mixed, required: false }],
        givesVP: { type: Boolean, required: true, default: false },
        img: { type: String, required: true, default: '' },
        persuasion: { type: Number, required: false },
        swords: { type: Number, required: false },
        trashedBonuses: [{ type: mongoose.Schema.Types.Mixed, required: false }],
        type: { type: String, required: true },
        effects: [{ type: mongoose.Schema.Types.Mixed, required: false }],
        copy: { type: Number, required: true, default: 1 }
    },
    { timestamps: false }
);

const ImperiumRowCard = cardsDB.model('ImperiumRowCard', imperiumRowCardSchema, 'imperium_row');

export default ImperiumRowCard;