import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export async function connectDB(dbName) {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: dbName
        });
    } catch (error) {
        console.log('Error connecting to MongoDB:', error);
    }
};