import { encryptId } from '../../utils/id-encrypter.js';
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid'
import { ObjectId } from "mongodb";
import Table from '../../models/tables/table.js';
import User from '../../models/user.js';
import Game from '../../models/tables/game.js';
import ImperiumRowCard from '../../models/cards/imperium-row-card.js';

dotenv.config();

const GAME_ROLES = {
    PLAYER: "PLAYER",
    SPECTATOR: "SPECTATOR"
}

export async function create(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { tableKey } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!tableKey) {
            res.status(400).json({ message: 'Invalid table' });
        }

        console.log("Creazione partita da parte di: " + _id + " - " + username);

        var game = await Game.create({
            host: username,
            key: uuidv4(),
            roomCode: createRoomCode(6),
            tableKey: tableKey,
            players: [{
                username: username,
                isGuest: false,
                cards: []
            }],
            spectators: []
        })

        console.log("Partita creata: " + game.key)
        console.log("Partita legata al tavolo: " + tableKey);

        const updatedTable = await Table.findOneAndUpdate({ key: tableKey }, { gameRunning: game.key });

        console.log("Aggiornato tavolo con partita in corso:" + game.key);

        var socket = req.app.io;
        socket.emit("gameCreated", game);

        res.status(200).json({ message: "Game created", gameId: game.key, roomCode: game.roomCode });
    } catch (error) {
        next(error);
    }
}

export async function getGameCards(req, res, next) {
    var user = req.user;

    const { _id, username } = req.user;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        const gameCards = await ImperiumRowCard.find({}, '_id img name').sort({ name: 1 });

        res.status(200).json({ gameCards: encryptId(gameCards) });
    } catch (error) {
        next(error);
    }
}

export async function addGuest(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, guestName } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !guestName) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const table = await Table.findOne({ gameRunning: gameId })
            .populate({ path: 'users', model: User });

        if (!table) {
            res.status(400).json({ message: 'Invalid table' });
        } else {
            if (table && table.users.some(s => s.username.includes(guestName))) {
                res.status(400).json({ message: 'Cannot use a username belonging to a player at this table' });
            } else {
                const game = await Game.findOne({ key: gameId });

                if (!game) {
                    res.status(400).json({ message: 'Invalid game' });
                } else {
                    //se il giocatore non è già nell'elenco
                    if (!game.players.some(s => s.username.includes(guestName))) {
                        if (game.players.length >= 6) {
                            res.status(400).json({ message: 'The room has reached the maximum number of players' });
                        } else {
                            var players = game.players;
                            players.push({
                                username: guestName,
                                isGuest: true,
                                cards: []
                            });
                            const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { players: players }, { "fields": { "_id": 0 }, new: true });

                            console.log("L'ospite " + guestName + " è stato aggiunto alla partita " + game.key);

                            var socket = req.app.io;
                            socket.to(game.key).emit("gameUpdated", updatedGame);

                            res.status(200).json();
                        }
                    } else {
                        //se il giocatore è già nell'elenco
                        console.log("Un ospite con lo username " + guestName + " è già nella partita " + game.key);

                        res.status(400).json({ message: "Username " + guestName + " already used" });
                    }
                }
            }
        }

    } catch (error) {
        next(error);
    }
}

export async function removeUser(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, playerId } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !playerId) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const game = await Game.findOne({ key: gameId });

        if (!game) {
            res.status(400).json({ message: 'Invalid game' });
        } else {
            //se il giocatore è nell'elenco
            if (game.players.some(s => s.username.includes(playerId))) {
                var players = game.players;

                var playerIndex = game.players.findIndex(p => p.username === playerId);

                if (playerIndex > -1) {
                    players.splice(playerIndex, 1);
                }

                const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { players: players }, { "fields": { "_id": 0 }, new: true });

                console.log("L'utente " + playerId + " è stato rimosso dalla partita " + game.key);

                var socket = req.app.io;
                socket.to(game.key).emit("gameUpdated", updatedGame);

                res.status(200).json();
            } else {
                //se il giocatore non è nell'elenco
                console.log("L'utente con lo username " + playerId + " non esiste nella partita nella partita " + game.key);

                res.status(400).json({ message: "Username " + playerId + " not in game" });
            }
        }

    } catch (error) {
        next(error);
    }
}

export async function joinGame(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { tableKey, roomCode, role } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!tableKey || !roomCode || !role) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const table = await Table.findOne({ key: tableKey })
            .populate({ path: 'owner', model: User })
            .populate({ path: 'users', model: User });

        if (!table || ((table && table.owner.username !== username) && (table && !table.users.some(s => s.username.includes(username))))) {
            res.status(400).json({ message: 'Invalid table' });
        } else {
            if (table && !table.gameRunning) {
                res.status(400).json({ message: 'No game runnig for this table' });
            } else {
                const game = await Game.findOne({ key: table.gameRunning });

                if (!game) {
                    res.status(400).json({ message: 'Invalid table' });
                } else {
                    var socket = req.app.io;

                    if (role === GAME_ROLES.PLAYER) {
                        if (game.spectators.includes(username)) {
                            console.error("Il giocatore " + _id + " - " + username + " ha provato ad unirsi alla partita " + game.key + " come " + GAME_ROLES.PLAYER);
                            console.error("Il giocatore " + _id + " - " + username + " è già unito alla partita " + game.key + " come " + GAME_ROLES.SPECTATOR);

                            res.status(400).json({ message: 'User is already a spectator' });
                        } else {
                            //se il giocatore non è già nell'elenco
                            if (!game.players.some(s => s.username.includes(username))) {
                                if (game.players.length >= 6) {
                                    res.status(400).json({ message: 'The room has reached the maximum number of players' });
                                } else {
                                    var players = game.players;
                                    players.push({
                                        username: username,
                                        isGuest: false,
                                        cards: []
                                    });
                                    const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { players: players }, { "fields": { "_id": 0 }, new: true });

                                    console.log("Il giocatore " + _id + " - " + username + " si è iscritto alla partita " + game.key + " come " + role);

                                    socket.sockets.in(game.key).emit('userJoin', username + ' joined as ' + role);

                                    res.status(200).json({ game: updatedGame });
                                }
                            } else {
                                //se il giocatore è già nell'elenco
                                console.log("Il giocatore " + _id + " - " + username + " si riunisce alla partita " + game.key + " come " + role);

                                socket.sockets.in(game.key).emit('userJoin', username + ' joined as ' + role);

                                res.status(200).json({ game: game });
                            }
                        }
                    } else {
                        if (game.players.some(s => s.username.includes(username))) {
                            console.error("Il giocatore " + _id + " - " + username + " ha provato ad unirsi alla partita " + game.key + " come " + GAME_ROLES.SPECTATOR);
                            console.error("Il giocatore " + _id + " - " + username + " è già unito alla partita " + game.key + " come " + GAME_ROLES.PLAYER);

                            res.status(400).json({ message: 'User is already a player' });
                        } else {
                            const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { $push: { spectators: username } }, { "fields": { "_id": 0 }, new: true });

                            console.log("Il giocatore " + _id + " - " + username + " si è iscritto alla partita " + game.key + " come " + role);

                            socket.sockets.in(game.key).emit('userJoin', username + ' joined as ' + role);
                            socket.sockets.in(game.key).emit("gameUpdated", updatedGame);

                            res.status(200).json({ game: updatedGame });
                        }
                    }
                }
            }
        }
    } catch (error) {
        next(error);
    }
}

export async function addCard(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, playerId, cardId, cardName, cardImg } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !playerId || !cardId || !cardName || !cardImg) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const game = await Game.findOne({ key: gameId });

        if (!game) {
            res.status(400).json({ message: 'Invalid game' });
        } else {
            var playerIndex = game.players.findIndex(p => p.username === playerId);

            //se il giocatore è nell'elenco
            if (playerIndex > -1) {
                var player = game.players[playerIndex];

                var newCard = {
                    key: cardId,
                    name: cardName,
                    img: cardImg
                };
                const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { $push: { [`players.${playerIndex}.cards`]: newCard } }, { "fields": { "_id": 0 }, new: true });

                console.log("L'utente: " + playerId + " ha comprato: " + cardName);

                var socket = req.app.io;
                socket.to(game.key).emit("gameUpdated", updatedGame);

                res.status(200).json();
            } else {
                console.log("Il giocatore " + playerId + " non esiste nella partita " + game.key);

                res.status(400).json({ message: "Player " + playerId + " does not exists" });
            }
        }

    } catch (error) {
        next(error);
    }
}

export async function removeCard(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, playerId, cardId, cardName } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !playerId || !cardId) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const game = await Game.findOne({ key: gameId });

        if (!game) {
            res.status(400).json({ message: 'Invalid game' });
        } else {
            var playerIndex = game.players.findIndex(p => p.username === playerId);

            //se il giocatore è nell'elenco
            if (playerIndex > -1) {
                var cards = game.players[playerIndex].cards;

                var cardIndex = cards.find(c => c.key === cardId);

                if (cardIndex === -1) {
                    console.log("La carta " + cardName + " non apparteneva al giocatore " + playerId + " nella partita " + game.key);

                    res.status(400).json({ message: "Card " + cardName + " was not acquired" });
                } else {
                    cards.splice(cardIndex, 1);

                    const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { [`players.${playerIndex}.cards`]: cards }, { "fields": { "_id": 0 }, new: true });

                    console.log("L'utente: " + playerId + " ha eliminato: " + cardName);

                    var socket = req.app.io;
                    socket.to(game.key).emit("gameUpdated", updatedGame);

                    res.status(200).json();
                }

            } else {
                console.log("Il giocatore " + playerId + " non esiste nella partita " + game.key);

                res.status(400).json({ message: "Player " + playerId + " does not exists" });
            }
        }

    } catch (error) {
        next(error);
    }
}

export async function endGame(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, tableKey } = body;

    //TODO salvare statistiche prima di eliminarla
    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !tableKey) {
            res.status(400).json({ message: 'Invalid params' });
        }

        await Game.findOneAndDelete({ key: gameId });

        console.log("L'host: " + _id + " - " + username + " ha chiuso manualmente la partita: " + gameId);

        const updatedTable = await Table.findOneAndUpdate({ key: tableKey }, { gameRunning: "" });

        console.log("Partita in corso rimossa dal tavolo: " + tableKey);

        var socket = req.app.io;
        socket.emit("gameEnded", {});

        res.status(200).json({ message: "Game ended" });
    } catch (error) {
        next(error);
    }
}

export async function tryReconnect(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, role } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const game = await Game.findOne({ key: gameId });

        if (!game) {
            res.status(400).json({ message: 'Previous game was closed' });
        } else {
            console.log("Il giocatore " + _id + " - " + username + " si riunisce alla partita " + game.key + " come " + role);

            res.status(200).json({ game: game });
        }
    } catch (error) {
        next(error);
    }
}

export async function editGuestName(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, guestName, newName } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !guestName || !newName) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const table = await Table.findOne({ gameRunning: gameId })
            .populate({ path: 'users', model: User });

        if (!table) {
            res.status(400).json({ message: 'Invalid table' });
        } else {
            if (table && table.users.some(s => s.username.includes(guestName))) {
                res.status(400).json({ message: 'Cannot use a username belonging to a player at this table' });
            } else {
                const game = await Game.findOne({ key: gameId });

                if (!game) {
                    res.status(400).json({ message: 'Invalid game' });
                } else {
                    //se il nuovo nome non è già in uso
                    if (!game.players.some(s => s.username.toLowerCase().includes(newName.toLowerCase()))) {
                        var playerIndex = game.players.findIndex(p => p.username === guestName);
                        const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { [`players.${playerIndex}.username`]: newName }, { "fields": { "_id": 0 }, new: true });

                        console.log("L'ospite " + guestName + " è stato modificato in " + newName + " nella partita " + game.key);

                        var socket = req.app.io;
                        socket.to(game.key).emit("gameUpdated", updatedGame);

                        res.status(200).json();
                    } else {
                        //se il nuovo nome è già in uso
                        console.log("Un giocatore con lo username " + newName + " è già nella partita " + game.key);

                        res.status(400).json({ message: "Username " + newName + " already used" });
                    }
                }
            }
        }

    } catch (error) {
        next(error);
    }
}

export async function leave(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, role } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !role) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const game = await Game.findOne({ key: gameId });

        if (!game) {
            res.status(400).json({ message: 'Invalid table' });
        } else {
            if (role === GAME_ROLES.PLAYER) {
                var players = game.players;

                var playerIndex = game.players.findIndex(p => p.username === username);

                if (playerIndex > -1) {
                    players.splice(playerIndex, 1);
                }

                const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { players: players }, { "fields": { "_id": 0 }, new: true });

                console.log("L'utente " + _id + " - " + username + " ha abbandonato la partita " + game.key + " come " + role);

                var socket = req.app.io;

                socket.sockets.in(game.key).emit("userLeaved", username + ' leaved as ' + role);
                socket.sockets.in(game.key).emit("gameUpdated", updatedGame);

                res.status(200).json();
            } else {
                if (game.spectators.includes(username)) {
                    const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { $pull: { spectators: username } }, { "fields": { "_id": 0 }, new: true });

                    console.log("Il giocatore " + _id + " - " + username + " ha lasciato la partita " + game.key + " come " + role);

                    var socket = req.app.io;
                    socket.sockets.in(game.key).emit("userLeaved", username + ' leaved as ' + role);
                    socket.sockets.in(game.key).emit("gameUpdated", updatedGame);

                    res.status(200).json({ game: updatedGame });
                }
            }
        }
    } catch (error) {
        next(error);
    }
}

function createRoomCode(length) {
    var result = '';
    const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ';
    const charactersLength = characters.length;
    var counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}