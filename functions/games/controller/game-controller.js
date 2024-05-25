import { encryptId } from '../../utils/id-encrypter.js';
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid'
import { ObjectId } from "mongodb";
import Table from '../../models/tables/table.js';
import User from '../../models/user.js';
import Game from '../../models/tables/game.js';
import ImperiumRowCard from '../../models/cards/imperium-row-card.js';
import { timerFormatter, timeStringToMilliseconds } from '../../utils/date-formatter.js';
import StartingDeckCard from '../../models/cards/starting-deck-card.js';

import { logger } from '../../utils/logger.js';

dotenv.config();

const GAME_ROLES = {
    PLAYER: "PLAYER",
    SPECTATOR: "SPECTATOR"
}

const PLAYER_COLORS = [
    {
        code: "#e61a16",
        name: "RED"
    },
    {
        code: "#06167e",
        name: "BLUE"
    },
    {
        code: "#169728",
        name: "GREEN"
    },
    {
        code: "#ffbb0a",
        name: "YELLOW"
    }
]

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

        logger.info("Creazione partita da parte di: " + _id + " - " + username);

        const startingCards = await StartingDeckCard.find({}, "_id img name copy");

        var newPlayer = createNewPlayer(username, startingCards, false);

        const gameCards = await ImperiumRowCard.aggregate([
            {
                $addFields: {
                    sortOrder: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$type", "PREPARE_THE_WAY"] }, then: 1 },
                                { case: { $eq: ["$type", "TSMF"] }, then: 2 },
                                { case: { $eq: ["$type", "IMPERIUM_ROW"] }, then: 3 }
                            ],
                            default: 4 // In caso di tipi non corrispondenti, li posizioniamo alla fine
                        }
                    }
                }
            },
            { $sort: { sortOrder: 1, name: 1 } } // Ordinamento per il campo sortOrder seguito dall'ordinamento alfabetico
        ]).project("_id img name copy");

        var game = await Game.create({
            host: username,
            key: uuidv4(),
            roomCode: createRoomCode(6),
            tableKey: tableKey,
            players: [newPlayer],
            spectators: [],
            cards: encryptId(gameCards)
        })

        logger.info("Partita creata: " + game.key)
        logger.info("Partita legata al tavolo: " + tableKey);

        const updatedTable = await Table.findOneAndUpdate({ key: tableKey }, { gameRunning: game.key });

        logger.info("Aggiornato tavolo con partita in corso:" + game.key);

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

        const gameCards = await ImperiumRowCard.aggregate([
            {
                $addFields: {
                    sortOrder: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$type", "PREPARE_THE_WAY"] }, then: 1 },
                                { case: { $eq: ["$type", "TSMF"] }, then: 2 },
                                { case: { $eq: ["$type", "IMPERIUM_ROW"] }, then: 3 }
                            ],
                            default: 4 // In caso di tipi non corrispondenti, li posizioniamo alla fine
                        }
                    }
                }
            },
            { $sort: { sortOrder: 1, name: 1 } } // Ordinamento per il campo sortOrder seguito dall'ordinamento alfabetico
        ]).project("_id img name copy");

        res.status(200).json({ gameCards: encryptId(gameCards) });
    } catch (error) {
        next(error);
    }
}

export async function getGameLeaders(req, res, next) {
    var user = req.user;

    const { _id, username } = req.user;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        //TODO aggiungere al db con nome e immagine
        // const gameCards = await ImperiumRowCard.aggregate([
        //     {
        //         $addFields: {
        //             sortOrder: {
        //                 $switch: {
        //                     branches: [
        //                         { case: { $eq: ["$type", "PREPARE_THE_WAY"] }, then: 1 },
        //                         { case: { $eq: ["$type", "TSMF"] }, then: 2 },
        //                         { case: { $eq: ["$type", "IMPERIUM_ROW"] }, then: 3 }
        //                     ],
        //                     default: 4 // In caso di tipi non corrispondenti, li posizioniamo alla fine
        //                 }
        //             }
        //         }
        //     },
        //     { $sort: { sortOrder: 1, name: 1 } } // Ordinamento per il campo sortOrder seguito dall'ordinamento alfabetico
        // ]).project("_id img name copy");

        const gameLeaders = [
            "FEYD-RAUTHA HARKONNEN",
            "GURNEY HALLECK",
            "LADY AMBER METULLI",
            "LADY JESSICA",
            "LADY MARGOT FENRING",
            "MUAD'DIB",
            "PRINCESS IRULAN",
            "SHADDAM CORRINO IV",
            "STABAN TUEK"
        ];

        res.status(200).json({ gameLeaders: gameLeaders });
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
            if (table && table.users.some(s => s.username === guestName)) {
                res.status(400).json({ message: 'Cannot use a username belonging to a player at this table' });
            } else {
                const game = await Game.findOne({ key: gameId });

                if (!game) {
                    res.status(400).json({ message: 'Invalid game' });
                } else {
                    //se il giocatore non è già nell'elenco
                    if (!game.players.some(s => s.username === guestName)) {
                        if (game.players.length >= 6) {
                            res.status(400).json({ message: 'The room has reached the maximum number of players' });
                        } else {
                            var players = game.players;
                            const startingCards = await StartingDeckCard.find({}, "_id img name copy");

                            players.push(createNewPlayer(guestName, startingCards, true));

                            const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { players: players }, { "fields": { "_id": 0 }, new: true });

                            logger.info("L'ospite " + guestName + " è stato aggiunto alla partita " + game.key);

                            var socket = req.app.io;
                            socket.to(game.key).emit("gameUpdated", updatedGame);

                            res.status(200).json();
                        }
                    } else {
                        //se il giocatore è già nell'elenco
                        logger.info("Un ospite con lo username " + guestName + " è già nella partita " + game.key);

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
            if (game.players.some(s => s.username === playerId)) {
                var players = game.players;

                var playerIndex = game.players.findIndex(p => p.username === playerId);

                if (playerIndex > -1) {
                    players.splice(playerIndex, 1);
                }

                const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { players: players }, { "fields": { "_id": 0 }, new: true });

                logger.info("L'utente " + playerId + " è stato rimosso dalla partita " + game.key);

                var socket = req.app.io;
                socket.to(game.key).emit("gameUpdated", updatedGame);

                res.status(200).json();
            } else {
                //se il giocatore non è nell'elenco
                logger.info("L'utente con lo username " + playerId + " non esiste nella partita nella partita " + game.key);

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

        if (!table || ((table && table.owner.username !== username) && (table && !table.users.some(s => s.username === username)))) {
            res.status(400).json({ message: 'Invalid table' });
        } else {
            if (table && !table.gameRunning) {
                res.status(400).json({ message: 'No game runnig for this table' });
            } else {
                const game = await Game.findOne({ key: table.gameRunning }, { _id: 0 });

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
                            if (!game.players.some(s => s.username === username)) {
                                if (game.players.length >= 6) {
                                    res.status(400).json({ message: 'The room has reached the maximum number of players' });
                                } else {
                                    var players = game.players;

                                    const startingCards = await StartingDeckCard.find({}, "_id img name copy");

                                    players.push(createNewPlayer(username, startingCards, false));
                                    const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { players: players }, { "fields": { "_id": 0 }, new: true });

                                    logger.info("Il giocatore " + _id + " - " + username + " si è iscritto alla partita " + game.key + " come " + role);

                                    socket.sockets.in(game.key).emit('userJoin', username + ' joined as ' + role);

                                    socket.to(game.key).emit("gameUpdated", updatedGame);

                                    res.status(200).json({ game: updatedGame });
                                }
                            } else {
                                //se il giocatore è già nell'elenco
                                logger.info("Il giocatore " + _id + " - " + username + " si riunisce alla partita " + game.key + " come " + role);

                                res.status(200).json({ game: game });
                            }
                        }
                    } else {
                        if (game.players.some(s => s.username === username)) {
                            console.error("Il giocatore " + _id + " - " + username + " ha provato ad unirsi alla partita " + game.key + " come " + GAME_ROLES.SPECTATOR);
                            console.error("Il giocatore " + _id + " - " + username + " è già unito alla partita " + game.key + " come " + GAME_ROLES.PLAYER);

                            res.status(400).json({ message: 'User is already a player' });
                        } else {

                            if (!game.spectators.includes(username)) {
                                const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { $push: { spectators: username } }, { "fields": { "_id": 0 }, new: true });

                                logger.info("Il giocatore " + _id + " - " + username + " si unisce alla partita " + game.key + " come " + role);

                                socket.sockets.in(game.key).emit('userJoin', username + ' joined as ' + role);
                                socket.sockets.in(game.key).emit("gameUpdated", updatedGame);
                                res.status(200).json({ game: updatedGame });
                            } else {
                                logger.info("Il giocatore " + _id + " - " + username + " si riunisce alla partita " + game.key + " come " + role);

                                res.status(200).json({ game: game });
                            }


                        }
                    }
                }
            }
        }
    } catch (error) {
        next(error);
    }
}

export async function addCards(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, playerId, cards } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !playerId || cards.length < 1) {
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

                var playerCards = player.cards;
                var playerTotalPoints = game.players[playerIndex].totalPoints;
                var playerTSMF = game.players[playerIndex].tsmfAcquired;

                for (const card of cards) {
                    var cardIndex = playerCards.findIndex(c => c.key === card.key);
                    //se già presente
                    if (cardIndex > -1) {
                        playerCards[cardIndex].copy = playerCards[cardIndex].copy + 1;
                    } else {
                        playerCards.push({
                            key: card.key,
                            name: card.name,
                            img: card.img,
                            copy: 1
                        });
                    }

                    if (card.name === "THE SPICE MUST FLOW") {
                        playerTotalPoints++;
                        playerTSMF++;
                    }
                }

                const updatedGame = await Game.findOneAndUpdate({ key: game.key }, {
                    [`players.${playerIndex}.cards`]: playerCards,
                    [`players.${playerIndex}.totalPoints`]: playerTotalPoints,
                    [`players.${playerIndex}.tsmfAcquired`]: playerTSMF
                }, { "fields": { "_id": 0 }, new: true });

                logger.info("L'utente: " + playerId + " ha comprato: " + cards.map(c => c.name).join(" - "));

                var socket = req.app.io;
                socket.to(game.key).emit("gameUpdated", updatedGame);

                res.status(200).json();
            } else {
                logger.info("Il giocatore " + playerId + " non esiste nella partita " + game.key);

                res.status(400).json({ message: "Player " + playerId + " does not exists" });
            }
        }

    } catch (error) {
        next(error);
    }
}

/* Remove card acquired for error */
export async function removeCard(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, playerId, cardId, cardName, cardPool } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !playerId || !cardId || !cardPool) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const game = await Game.findOne({ key: gameId });

        if (!game) {
            res.status(400).json({ message: 'Invalid game' });
        } else {
            var playerIndex = game.players.findIndex(p => p.username === playerId);

            //se il giocatore è nell'elenco
            if (playerIndex > -1) {
                var cards = game.players[playerIndex][cardPool];

                var cardIndex = cards.findIndex(c => c.key === cardId);

                if (cardIndex === -1) {
                    logger.info("La carta " + cardName + " non apparteneva al giocatore " + playerId + " nella partita " + game.key);

                    res.status(400).json({ message: "Card " + cardName + " was not acquired" });
                } else {

                    var card = cards[cardIndex];

                    //se presente in più copie
                    if (cards[cardIndex].copy > 1) {
                        cards[cardIndex].copy = cards[cardIndex].copy - 1;
                    } else {
                        cards.splice(cardIndex, 1);
                    }

                    var playerTotalPoints = game.players[playerIndex].totalPoints;
                    var playerTSMF = game.players[playerIndex].tsmfAcquired;

                    if (card.name === "THE SPICE MUST FLOW" && cardPool === "cards") {
                        playerTotalPoints--;
                        playerTSMF--;
                    }

                    const updatedGame = await Game.findOneAndUpdate({ key: game.key }, {
                        [`players.${playerIndex}.${cardPool}`]: cards,
                        [`players.${playerIndex}.totalPoints`]: playerTotalPoints,
                        [`players.${playerIndex}.tsmfAcquired`]: playerTSMF
                    }, { "fields": { "_id": 0 }, new: true });

                    logger.info("L'utente: " + playerId + " ha rimosso (non eliminato): " + cardName);

                    var socket = req.app.io;
                    socket.to(game.key).emit("gameUpdated", updatedGame);

                    res.status(200).json();
                }

            } else {
                logger.info("Il giocatore " + playerId + " non esiste nella partita " + game.key);

                res.status(400).json({ message: "Player " + playerId + " does not exists" });
            }
        }

    } catch (error) {
        next(error);
    }
}

/* Trash a card */
export async function trashCard(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, playerId, cardId, cardName, cardPool } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !playerId || !cardId || !cardPool) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const game = await Game.findOne({ key: gameId });

        if (!game) {
            res.status(400).json({ message: 'Invalid game' });
        } else {
            var playerIndex = game.players.findIndex(p => p.username === playerId);

            //se il giocatore è nell'elenco
            if (playerIndex > -1) {
                var cards = game.players[playerIndex][cardPool];

                var cardIndex = cards.findIndex(c => c.key === cardId);

                if (cardIndex === -1) {
                    logger.info("La carta " + cardName + " non apparteneva al giocatore " + playerId + " nella partita " + game.key);

                    res.status(400).json({ message: "Card " + cardName + " was not acquired" });
                } else {
                    var trashedCards = game.players[playerIndex].trashedCards;
                    var trashedCard = cards[cardIndex];

                    //se presente in più copie
                    if (cards[cardIndex].copy > 1) {
                        cards[cardIndex].copy = cards[cardIndex].copy - 1;
                    } else {
                        cards.splice(cardIndex, 1);
                    }

                    //cerca la carta appena eliminata tra le carte eliminate del giocatore
                    var trashedCardIndex = trashedCards.findIndex(c => c.key === trashedCard.key);
                    //se già presente
                    if (trashedCardIndex > -1) {
                        trashedCards[trashedCardIndex].copy = trashedCards[trashedCardIndex].copy + 1;
                    } else {
                        trashedCards.push({
                            key: trashedCard.key,
                            name: trashedCard.name,
                            img: trashedCard.img,
                            copy: 1
                        });
                    }

                    const updatedGame = await Game.findOneAndUpdate({ key: game.key }, {
                        [`players.${playerIndex}.${cardPool}`]: cards,
                        [`players.${playerIndex}.trashedCards`]: trashedCards,
                    }, { "fields": { "_id": 0 }, new: true });

                    logger.info("L'utente: " + playerId + " ha eliminato: " + cardName);

                    var socket = req.app.io;
                    socket.to(game.key).emit("gameUpdated", updatedGame);

                    res.status(200).json();
                }

            } else {
                logger.info("Il giocatore " + playerId + " non esiste nella partita " + game.key);

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

        logger.info("L'host: " + _id + " - " + username + " ha chiuso manualmente la partita: " + gameId);

        const updatedTable = await Table.findOneAndUpdate({ key: tableKey }, { gameRunning: "" });

        logger.info("Partita in corso rimossa dal tavolo: " + tableKey);

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

        const game = await Game.findOne({ key: gameId }, { _id: 0 });

        if (!game) {
            res.status(400).json({ message: 'Previous game was closed' });
        } else {
            logger.info("Il giocatore " + _id + " - " + username + " si riunisce alla partita " + game.key + " come " + role);

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
            if (table && table.users.some(s => s.username.toLowerCase() === newName.toLowerCase())) {
                res.status(400).json({ message: 'Cannot use a username belonging to another player at this table' });
            } else {
                const game = await Game.findOne({ key: gameId });

                if (!game) {
                    res.status(400).json({ message: 'Invalid game' });
                } else {
                    //se il nuovo nome non è già in uso
                    if (!game.players.some(s => s.username.toLowerCase() === newName.toLowerCase())) {
                        var playerIndex = game.players.findIndex(p => p.username === guestName);
                        const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { [`players.${playerIndex}.username`]: newName }, { "fields": { "_id": 0 }, new: true });

                        logger.info("L'ospite " + guestName + " è stato modificato in " + newName + " nella partita " + game.key);

                        var socket = req.app.io;
                        socket.to(game.key).emit("gameUpdated", updatedGame);

                        res.status(200).json();
                    } else {
                        //se il nuovo nome è già in uso
                        logger.info("Un giocatore con lo username " + newName + " è già nella partita " + game.key);

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

                logger.info("L'utente " + _id + " - " + username + " ha abbandonato la partita " + game.key + " come " + role);

                var socket = req.app.io;

                socket.sockets.in(game.key).emit("userLeaved", username + ' leaved as ' + role);
                socket.sockets.in(game.key).emit("gameUpdated", updatedGame);

                res.status(200).json();
            } else {
                if (game.spectators.includes(username)) {
                    const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { $pull: { spectators: username } }, { "fields": { "_id": 0 }, new: true });

                    logger.info("Il giocatore " + _id + " - " + username + " ha lasciato la partita " + game.key + " come " + role);

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

export async function selectOrder(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const game = await Game.findOne({ key: gameId });

        if (!game) {
            res.status(400).json({ message: 'Invalid game' });
        } else {

            var randomOrderedPlayers = game.players.sort(() => Math.random() - 0.5);
            var randomOrderedColors = PLAYER_COLORS.sort(() => Math.random() - 0.5);

            for (let index = 0; index < randomOrderedPlayers.length; index++) {
                randomOrderedPlayers[index].color = randomOrderedColors[index].name;
                randomOrderedPlayers[index].colorCode = randomOrderedColors[index].code;
            }

            const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { players: randomOrderedPlayers }, { "fields": { "_id": 0 }, new: true });

            logger.info("L'ordine dei giocatori della partita " + game.key + " è stato deciso");

            var socket = req.app.io;
            socket.to(game.key).emit("gameUpdated", updatedGame);

            res.status(200).json();
        }

    } catch (error) {
        next(error);
    }
}

export async function startGame(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, players } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const game = await Game.findOne({ key: gameId });

        if (!game) {
            res.status(400).json({ message: 'Invalid game' });
        } else {

            var updatedPlayers = game.players;

            for (let index = 0; index < players.length; index++) {
                updatedPlayers[index].leader = players[index].leader;
            }

            const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { startedAt: new Date(), players: updatedPlayers }, { "fields": { "_id": 0 }, new: true });

            logger.info("La partita " + game.key + " è stata avviata da " + _id + " - " + username);

            var socket = req.app.io;
            socket.to(game.key).emit("gameUpdated", updatedGame);

            res.status(200).json();
        }

    } catch (error) {
        next(error);
    }
}

export async function startTurn(req, res, next) {
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

            var players = game.players;

            var activePlayerIndex = game.players.findIndex(p => p.isActive);
            if (activePlayerIndex > -1) {
                game.players[activePlayerIndex].isActive = false;
                var durationDate = new Date().getTime() - game.players[activePlayerIndex].activeDate.getTime();
                durationDate += timeStringToMilliseconds(game.players[activePlayerIndex].time);
                game.players[activePlayerIndex].time = timerFormatter(durationDate);
                game.players[activePlayerIndex].tempTime = timerFormatter(durationDate);
            }

            var playerIndex = game.players.findIndex(p => p.username === playerId);
            if (playerIndex > -1) {
                game.players[playerIndex].isActive = true;
                game.players[playerIndex].activeDate = new Date();
            }

            const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { players: players }, { "fields": { "_id": 0 }, new: true });

            var socket = req.app.io;
            socket.to(game.key).emit("gameUpdated", updatedGame);

            res.status(200).json();
        }

    } catch (error) {
        next(error);
    }
}

export async function stopTurn(req, res, next) {
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

            var players = game.players;

            var activePlayerIndex = game.players.findIndex(p => p.isActive);
            if (activePlayerIndex > -1) {
                game.players[activePlayerIndex].isActive = false;
                var durationDate = new Date().getTime() - game.players[activePlayerIndex].activeDate.getTime();
                durationDate += timeStringToMilliseconds(game.players[activePlayerIndex].time);
                game.players[activePlayerIndex].time = timerFormatter(durationDate);
                game.players[activePlayerIndex].tempTime = timerFormatter(durationDate);
            }

            const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { players: players }, { "fields": { "_id": 0 }, new: true });

            var socket = req.app.io;
            socket.to(game.key).emit("gameUpdated", updatedGame);

            res.status(200).json();
        }

    } catch (error) {
        next(error);
    }
}

export async function updatePlayer(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, playerId, value } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !playerId || !value) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const game = await Game.findOne({ key: gameId });

        if (!game) {
            res.status(400).json({ message: 'Invalid game' });
        } else {

            var players = game.players;

            var playerIndex = game.players.findIndex(p => p.username === playerId);
            if (playerIndex > -1) {
                var updatedPlayer = game.players[playerIndex];
                for (const key of Object.keys(value)) {
                    updatedPlayer[key] = value[key];
                }
            }

            const updatedGame = await Game.findOneAndUpdate({ key: game.key }, { [`players.${playerIndex}`]: updatedPlayer }, { "fields": { "_id": 0 }, new: true });

            var socket = req.app.io;
            socket.to(game.key).emit("gameUpdated", updatedGame);

            res.status(200).json();
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

function createNewPlayer(username, startingCards, isGuest) {
    var player = {
        isGuest: isGuest,
        username: username,
        order: 0,
        leader: "",
        color: "",
        colorCode: "",
        isActive: false,
        activeDate: new Date(),
        time: "00:00:00",
        tempTime: "00:00:00",
        totalPoints: 1,
        tsmfAcquired: 0,
        conflictPoints: 0,
        otherPoints: 0,
        fremenFriendship: false,
        beneGesseritFriendship: false,
        spacingGuildFriendship: false,
        emperorFriendship: false,
        fremenAlliance: false,
        beneGesseritAlliance: false,
        spacingGuildAlliance: false,
        emperorAlliance: false,
        solari: 0,
        spice: 0,
        water: 1,
        troops: 3,
        startingDeck: changeIdToKey(encryptId(startingCards)),
        cards: [],
        trashedCards: []

    }
    return player;
}

function changeIdToKey(cards) {
    var newCards = [];
    for (let index = 0; index < cards.length; index++) {
        newCards.push({
            key: cards[index]._id,
            name: cards[index].name,
            img: cards[index].img,
            copy: cards[index].copy
        }
        );
    }
    return newCards;
}