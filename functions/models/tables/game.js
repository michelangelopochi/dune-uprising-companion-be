import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const tableDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "tables");

const GameSchema = new mongoose.Schema(
    {
        host: { type: String, required: true },
        key: { type: String, required: true },
        roomCode: { type: String, required: true },
        tableKey: { type: String, required: true },
        players: [{ type: mongoose.Schema.Types.Mixed }], //player.js
        spectators: [{ type: String }],
        leaders: [{ type: String }],
        removedLeaders: [{ type: String }],
        startedAt: { type: Date, default: "" },
        duration: { type: String, default: "" },
        roundPlayed: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const Game = tableDB.model('Game', GameSchema);

export default Game;