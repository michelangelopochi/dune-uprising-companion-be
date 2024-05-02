const Table = require('../../models/tables/table');
const User = require('../../models/user');
const ImperiumRowCard = require('../../models/cards/imperium-row-card');
const { initializeApp } = require("firebase/app");
const { getAnalytics } = require("firebase/analytics");
const { getDatabase, ref, get, set, onValue, update, goOffline, push, goOnline, remove, increment } = require("firebase/database");
const { encryptId } = require("../../utils/id-encrypter");
require('dotenv').config();

var database = null;

var firebaseConfig = {
    apiKey: "AIzaSyAZySrZE3VSn1l7ztsy1pONtRD_KMPuUr0",
    authDomain: "dune-uprising-app-test.firebaseapp.com",
    databaseURL: "https://dune-uprising-app-test-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "dune-uprising-app-test",
    storageBucket: "dune-uprising-app-test.appspot.com",
    messagingSenderId: "1071458741447",
    appId: "1:1071458741447:web:e3672846d7042e55e422e2",
    measurementId: "G-4EKPJBS3EL"
};

const create = async (req, res, next) => {
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

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

        database = getDatabase();
        const tablesRef = ref(database, 'tables');

        console.log("Connessione al db realtime stabilita");
        console.log("Creazione partita da parte di: " + _id + " - " + username);

        const createdGame = push(tablesRef, {
            roomCode: createTableID(6),
            tableKey: tableKey,
            host: username,
            users: {
                [username]: {
                    cards: ""
                }
            },
            createdAt: new Date().toISOString()
        });

        console.log("Partita creata: " + createdGame.key)
        console.log("Partita legata al tavolo: " + tableKey);

        const updatedTable = await Table.findOneAndUpdate({ key: tableKey }, { gameRunning: createdGame.key });

        console.log("Aggiornato tavolo con partita in corso:" + updatedTable.gameRunning);

        res.status(200).json({ config: firebaseConfig, gameId: createdGame.key });
    } catch (error) {
        next(error);
    }
}

const getGameCards = async (req, res, next) => {
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

const addGuest = async (req, res, next) => {
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

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

        database = getDatabase();
        const usersRef = ref(database, 'tables/' + gameId + '/users');

        console.log("Connessione all'oggetto partita stabilita");

        const newPlayer = update(usersRef, {
            [guestName]: {
                cards: ""
            }
        })

        console.log("L'host: " + _id + " - " + username + " ha aggiunto l'ospite: " + guestName);

        res.status(200).json();

    } catch (error) {
        next(error);
    }
}

const joinGame = async (req, res, next) => {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { tableKey, roomCode } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!tableKey || !roomCode) {
            res.status(400).json({ message: 'Invalid params' });
        }

        const table = await Table.findOne({ key: tableKey });

        if (!table) {
            res.status(400).json({ message: 'Invalid table' });
        } else {
            if (table && !table.gameRunning) {
                res.status(400).json({ message: 'No game runnig for this table' });
            } else {

                // Initialize Firebase
                const app = initializeApp(firebaseConfig);

                database = getDatabase();
                const usersRef = ref(database, 'tables/' + table.gameRunning + '/users');
                const playerRef = ref(database, 'tables/' + table.gameRunning + '/users/' + username);

                console.log("Connessione all'oggetto partita stabilita");

                get(playerRef).then((snapshot) => {
                    if (!snapshot.exists()) {
                        //se giocatore non si era già unito
                        const newPlayer = update(usersRef, {
                            [username]: {
                                cards: ""
                            }
                        })
                    }
                }).catch((error) => {
                    console.error(error);
                });

                console.log("Il giocatore " + _id + " - " + username + " si è unito alla partita " + table.gameRunning);

                res.status(200).json({ config: firebaseConfig, gameId: table.gameRunning });
            }
        }
    } catch (error) {
        next(error);
    }
}

const addCard = async (req, res, next) => {
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

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

        database = getDatabase();
        const userCardsRef = ref(database, 'tables/' + gameId + '/users/' + playerId + '/cards');
        const cardRef = ref(database, 'tables/' + gameId + '/users/' + playerId + '/cards/' + cardId);

        get(cardRef).then((snapshot) => {
            if (snapshot.exists()) {
                //multipla copia
                const updatedCard = update(cardRef, {
                    copies: increment(1)
                })
            } else {
                //primo acquisto
                const acquiredCard = update(userCardsRef, {
                    [cardId]: {
                        name: cardName,
                        img: cardImg,
                        copies: 1
                    }
                })
            }
        }).catch((error) => {
            console.error(error);
        });

        console.log("L'utente: " + playerId + " ha comprato: " + cardName);

        res.status(200).json();
    } catch (error) {
        next(error);
    }
}

const removeCard = async (req, res, next) => {
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

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

        database = getDatabase();
        const userRef = ref(database, 'tables/' + gameId + '/users/' + playerId);
        const userCardsRef = ref(database, 'tables/' + gameId + '/users/' + playerId + '/cards');
        const cardRef = ref(database, 'tables/' + gameId + '/users/' + playerId + '/cards/' + cardId);

        get(cardRef).then((snapshot) => {
            if (snapshot.exists()) {
                cardData = snapshot.val();
                if (cardData.copies && cardData.copies > 1) {
                    const updatedCard = update(cardRef, {
                        copies: increment(-1)
                    })
                } else {
                    get(userCardsRef).then(async (snap) => {
                        const userCards = snap.val();
                        //se ci sono altre carte
                        if (Object.keys(userCards).length > 1) {
                            await remove(cardRef);
                        } else {
                            //se non ci sono altre carte
                            const removedCard = update(userRef, {
                                cards: ""
                            })
                        }
                    }).catch((error) => {
                        console.error(error);
                    });
                }
            }

            console.log("L'utente: " + playerId + " ha eliminato: " + cardName);

        }).catch((error) => {
            console.error(error);
        });


        res.status(200).json();
    } catch (error) {
        next(error);
    }
}

const endGame = async (req, res, next) => {
    var user = req.user;
    var body = req.body;

    const { _id, username } = req.user;
    const { gameId, tableKey } = body;

    //TODO salvare dati su mongodb prima di eliminarla da firebase
    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!gameId || !tableKey) {
            res.status(400).json({ message: 'Invalid params' });
        }

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

        database = getDatabase();
        const gameRef = ref(database, 'tables/' + gameId);

        console.log("Connessione al db realtime stabilita");

        await remove(gameRef);

        console.log("L'host: " + _id + " - " + username + " ha chiuso manualmente la partita: " + gameId);

        const updatedTable = await Table.findOneAndUpdate({ key: tableKey }, { gameRunning: "" });

        console.log("Partita in corso rimossa dal tavolo: " + tableKey);

        res.status(200).json({ message: "Game ended" });
    } catch (error) {
        next(error);
    }
}

const createTableID = (length) => {
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

module.exports = { getGameCards, create, addGuest, joinGame, addCard, removeCard, endGame };