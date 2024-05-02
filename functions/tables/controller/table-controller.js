const Table = require('../../models/tables/table');
const User = require('../../models/user');
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

    //TODO
    try {
        res.status(200).json({ message: "chiamata create ok" });
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

    //TODO
    try {
        res.status(200).json({ message: "chiamata create ok" });
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