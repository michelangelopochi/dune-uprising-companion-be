import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import User from "../../models/user.js";
import Table from "../../models/tables/table.js";
import { v4 as uuidv4 } from 'uuid'

dotenv.config();

export async function getUserTables(req, res, next) {
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

export async function create(req, res, next) {
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

export async function deleteTable(req, res, next) {
    var user = req.user;

    //TODO
    //TODO rimuovere anche tutte le partite e le statistiche associate al tavolo
    try {
        res.status(200).json({ message: "chiamata create ok" });
    } catch (error) {
        next(error);
    }
}

export async function addUser(req, res, next) {
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

        await Table.findOneAndUpdate({ key: tableKey }, { $push: { users: userFound._id } });

        var updatedTable = await Table.findOne({ owner: _id }, '-_id').sort({ name: 1 })
            .populate({ path: 'owner', model: User, options: { collation: { 'locale': 'en' }, sort: { 'username': 1 } }, select: 'username avatar -_id' })
            .populate({ path: 'users', model: User, options: { collation: { 'locale': 'en' }, sort: { 'username': 1 } }, select: 'username avatar -_id' });

        console.log(`L'utente ${_id} - ${username} ha aggiunto l'utente ${userFound._id} - ${userToAdd} al tavolo ${tableKey}`);

        res.status(200).json({ message: "User " + userToAdd + " added", table: updatedTable });
    } catch (error) {
        next(error);
    }
}

export async function removeUser(req, res, next) {
    var user = req.user;
    var body = req.body

    const { _id, username } = req.user;
    const { tableKey, userToRemove } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        if (!tableKey || !userToRemove) {
            res.status(400).json({ message: 'Invalid params' });
        }

        var userFound = await User.findOne({ username: userToRemove });

        if (!userFound) {
            console.log(`L'utente ${userToRemove} non è stato trovato`);
            res.status(400).json({ message: 'No user found' });
        }

        await Table.findOneAndUpdate({ key: tableKey }, { $pull: { users: userFound._id } });

        var updatedTable = await Table.findOne({ owner: _id }, '-_id').sort({ name: 1 })
            .populate({ path: 'owner', model: User, options: { collation: { 'locale': 'en' }, sort: { 'username': 1 } }, select: 'username avatar -_id' })
            .populate({ path: 'users', model: User, options: { collation: { 'locale': 'en' }, sort: { 'username': 1 } }, select: 'username avatar -_id' });

        console.log(`L'utente ${_id} - ${username} ha rimosso l'utente ${userFound._id} - ${userToRemove} dal tavolo ${tableKey}`);

        res.status(200).json({ message: "User " + userToRemove + " removed", table: updatedTable });
    } catch (error) {
        next(error);
    }
}

export async function getAllSubscribleUsers(req, res, next) {
    var user = req.user;
    var body = req.body

    const { _id, username } = req.user;
    const { tableKey } = body;

    try {
        if (!_id) {
            res.status(400).json({ message: 'Invalid user' });
        }

        var users = [];

        if (!tableKey) {
            users = await User.find({ $and: [{ _id: { $ne: _id } }, { role: { $ne: 'test' } }] }, 'username avatar -_id');
        } else {
            var table = await Table.findOne({ key: tableKey });
            if (table) {
                users = await User.find({ $and: [{ _id: { $ne: _id } }, { $or: [{ _id: { $ne: table.owner } }, { _id: { $in: table.users } }] }] }, 'username avatar -_id');
            }
        }

        console.log(`L'utente ${_id} - ${username} ha cercato gli utenti iscrivibili al tavolo ${tableKey ? tableKey : ''}`);

        res.status(200).json({ users: users });
    } catch (error) {
        next(error);
    }
}