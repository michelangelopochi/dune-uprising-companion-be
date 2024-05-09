import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const cardsDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "cards");

const presetSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        key: { type: String, required: true },
        imperiumRowCards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ImperiumRowCard' }],
        intrigueCards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'IntrigueCard' }],
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        lastSearch: { type: Date, default: Date.now() },
        thisWeek: { type: Number, default: 1 },
        total: { type: Number, default: 1 }
    },
    { timestamps: true }
);

const Preset = cardsDB.model('Preset', presetSchema);

export default Preset;