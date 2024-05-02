
import BGGRouter from "./bgg/bgg-router.mjs";
import cardsRouter from "./cards/cards-router.mjs";
import authRouter from "./auth/auth-router.js";
import userRouter from "./user/user-router.js";
import presetRouter from "./presets/preset-router.js";
import tableRouter from "./tables/table-router.js";
import gameRouter from "./games/game-router.js";
import connectDB from "./utils/db.js";

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");


const api = express();
const router = Router();
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
// api.use("/bgg", BGGRouter);
// api.use("/cards", cardsRouter);
// api.use("/auth", authRouter);
// api.use("/user", userRouter);
// api.use("/presets", presetRouter);
// api.use("/tables", tableRouter);
// api.use("/games", gameRouter);
// api.use('/', anotherRouter);

// const routeHandler = serverless(api);

api.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})