const Table = require('../../models/tables/table');
const User = require('../../models/user');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
require('dotenv').config();

const getUserTables = async (req, res, next) => {
    var user = req.user;

    const { _id } = req.user;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        var userTables = await Table.find({ owner: _id }, '-_id').sort({ name: 1 })
            .populate({ path: 'owner', model: User, options: { collation: { 'locale': 'en' }, sort: { 'username': 1 } }, select: 'username avatar -_id' })
            .populate({ path: 'users', model: User, options: { collation: { 'locale': 'en' }, sort: { 'username': 1 } }, select: 'username avatar -_id' });

        var partecipantsTables = await Table.find({ users: _id }, '-_id -gameRunning').sort({ name: 1 })
            .populate({ path: 'owner', model: User, options: { collation: { 'locale': 'en' }, sort: { 'username': 1 } }, select: 'username avatar -_id' })
            .populate({ path: 'users', model: User, options: { collation: { 'locale': 'en' }, sort: { 'username': 1 } }, select: 'username avatar -_id' });

        res.status(200).json({ userTables: userTables, partecipantsTables: partecipantsTables });
    } catch (error) {
        next(error);
    }
}

const create = async (req, res, next) => {
    var user = req.user;
    var body = req.body

    const { _id, username } = req.user;
    const { name, usersToAdd } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        var users = [];

        for (const userId of usersToAdd) {
            var userToAdd = await User.findOne({ username: userId });
            if (userToAdd) {
                users.push(userToAdd._id);
            }
        }

        var tableCreated = await Table.create({
            name: name,
            owner: _id,
            users: users,
            key: uuidv4()
        });

        console.log(`L'utente ${_id} - ${username} ha creato il tavolo ${name} - ${tableCreated.key}`);

        res.status(200).json({ message: "Table created" });
    } catch (error) {
        next(error);
    }
}

const deleteTable = async (req, res, next) => {
    var user = req.user;

    //TODO
    try {
        res.status(200).json({ message: "chiamata create ok" });
    } catch (error) {
        next(error);
    }
}

const addUser = async (req, res, next) => {
    var user = req.user;
    var body = req.body

    const { _id, username } = req.user;
    const { tableKey, userToAdd } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!tableKey || !userToAdd) {
            res.status(400).json({ message: 'Invalid params' });
        }

        var userFound = await User.findOne({ username: userToAdd });

        if (!userFound) {
            console.log(`L'utente ${userToAdd} non è stato trovato`);
            res.status(400).json({ message: 'No user found' });
        }

        var updatedTable = await Table.findOneAndUpdate({ key: tableKey }, { $push: { users: userFound._id } });

        console.log(`L'utente ${_id} - ${username} ha aggiunto l'utente ${userFound._id} - ${userToAdd} al tavolo ${tableKey}`);

        res.status(200).json({ message: "User " + userToAdd + " added" });
    } catch (error) {
        next(error);
    }
}

const removeUser = async (req, res, next) => {
    var user = req.user;

    //TODO
    try {
        res.status(200).json({ message: "chiamata create ok" });
    } catch (error) {
        next(error);
    }
}

module.exports = { getUserTables, create, deleteTable, addUser, removeUser };