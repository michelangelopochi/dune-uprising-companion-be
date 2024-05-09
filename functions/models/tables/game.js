import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const tableDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "tables");

const GameSchema = new mongoose.Schema(
    {
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }
);

const Game = tableDB.model('Game', GameSchema);

export default Game;