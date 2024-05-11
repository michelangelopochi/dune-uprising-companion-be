import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const tableDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "tables");

const StatSchema = new mongoose.Schema(
    {
        name: { type: String, required: false } //TODO
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const Stat = tableDB.model('Stat', StatSchema);

export default Stat;