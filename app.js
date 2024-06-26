import express, { Router } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from 'cors';
import dotenv from 'dotenv';
import BGGRouter from "./functions/bgg/bgg-router.mjs";
import cardsRouter from "./functions/cards/cards-router.js";
import authRouter from "./functions/auth/auth-router.js";
import userRouter from "./functions/user/user-router.js";
import presetRouter from "./functions/presets/preset-router.js";
import tableRouter from "./functions/tables/table-router.js";
import gameRouter from "./functions/games/game-router.js";
import { connectDB } from "./functions/utils/db.js";
import cookieParser from "cookie-parser";
import { logger } from "./functions/utils/logger.js";

const api = express();
const router = express.Router();
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

const server = http.createServer(api); // Create HTTP server using Express
const ioServer = new Server(server, {
	cors: {
		origin: '*'
	}
}); // Initialize Socket.IO with the HTTP server

ioServer.on("connection", (socket) => {
	logger.info("Client connected:", socket.id);

	socket.on('join', function (username, room, role) {
		socket.join(room);
		logger.info("Il giocatore " + username + " si è unito alla partita " + room + " come " + role);

		socket.broadcast.to(room).emit('playerJoin', username + ' joined as ' + role);
	});
});

api.io = ioServer;

server.listen(port, () => {
	logger.info(`Server listening on port ${port}`)
})