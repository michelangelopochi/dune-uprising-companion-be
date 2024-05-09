import express, { Router } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from 'cors';
import dotenv from 'dotenv';
import BGGRouter from "./functions/bgg/bgg-router.mjs";
import cardsRouter from "./functions/cards/cards-router.mjs";
import authRouter from "./functions/auth/auth-router.js";
import userRouter from "./functions/user/user-router.js";
import presetRouter from "./functions/presets/preset-router.js";
import tableRouter from "./functions/tables/table-router.js";
import gameRouter from "./functions/games/game-router.js";
import { connectDB } from "./functions/utils/db.js";
import cookieParser from "cookie-parser";

const api = express();
const router = express.Router();
const server = http.createServer(api); // Create HTTP server using Express
const ioServer = new Server(server, {
  cors: {
    origin: '*'
  }
}); // Initialize Socket.IO with the HTTP server
const port = process.env.PORT || 3000;

dotenv.config();

api.use(express.json()); // Add this line to enable JSON parsing in the request body
api.use(cors());
api.use(cookieParser());

connectDB("users");

router.get("/", (req, res) => {
  res.status(200).json({ message: "The server is working" })
});

// Add this error handling middleware
api.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong');
});

api.use("/api", router);
api.use("/bgg", BGGRouter);
api.use("/cards", cardsRouter);
api.use("/auth", authRouter);
api.use("/user", userRouter);
api.use("/presets", presetRouter);
api.use("/tables", tableRouter);
api.use("/games", gameRouter);
// api.use('/', anotherRouter);

// const routeHandler = serverless(api);

ioServer.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Esempio di invio di un messaggio da parte del server al client
  socket.on("message", (data) => {
    console.log("received", data.message)
    socket.emit("messageEdited", data.message)
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})