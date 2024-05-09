import { Router } from "express";
import { authenticate } from "../middlewares/auth-middleware.js";
import { create, getGameCards, addGuest, joinGame, addCard, removeCard, endGame } from "./controller/game-controller.js";

const gameRouter = Router();

gameRouter.post('/create', authenticate, create);

gameRouter.get('/getGameCards', authenticate, getGameCards);

gameRouter.post('/addGuest', authenticate, addGuest);

gameRouter.post('/join', authenticate, joinGame);

gameRouter.post('/addCard', authenticate, addCard);

gameRouter.post('/removeCard', authenticate, removeCard);

gameRouter.post('/endGame', authenticate, endGame);

export default gameRouter;