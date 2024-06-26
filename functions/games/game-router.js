import { Router } from "express";
import { authenticate } from "../middlewares/auth-middleware.js";
import { create, addGuest, joinGame, addCards, removeCard, endGame, tryReconnect, editGuestName, leave, removeUser, startGame, startTurn, stopTurn, updatePlayer, selectOrder, trashCard, selectLeader, stopGame } from "./controller/game-controller.js";

const gameRouter = Router();

gameRouter.post('/create', authenticate, create);

gameRouter.post('/addGuest', authenticate, addGuest);

gameRouter.post('/removeUser', authenticate, removeUser);

gameRouter.post('/join', authenticate, joinGame);

gameRouter.post('/addCards', authenticate, addCards);

gameRouter.post('/removeCard', authenticate, removeCard);

gameRouter.post('/trashCard', authenticate, trashCard);

gameRouter.post('/endGame', authenticate, endGame);

gameRouter.post('/tryReconnect', authenticate, tryReconnect);

gameRouter.post('/editGuestName', authenticate, editGuestName);

gameRouter.post('/leave', authenticate, leave);

gameRouter.post('/selectOrder', authenticate, selectOrder);

gameRouter.post('/startGame', authenticate, startGame);

gameRouter.post('/stopGame', authenticate, stopGame);

gameRouter.post('/startTurn', authenticate, startTurn);

gameRouter.post('/stopTurn', authenticate, stopTurn);

gameRouter.post('/selectLeader', authenticate, selectLeader);

gameRouter.post('/updatePlayer', authenticate, updatePlayer);

export default gameRouter;