import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../../models/user.js";
import Search from "../../models/search.js";
import Preset from "../../models/preset.js";
import ImperiumRowCard from "../../models/cards/imperium-row-card.js";
import IntrigueCard from "../../models/cards/intrigue-card.js";
import { encryptId, decryptId } from "../../utils/id-encrypter.js";
import { v4 as uuidv4 } from 'uuid'

dotenv.config();

// Save a new preset
export async function save(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id, presets } = req.user;
    const { name, imperiumRowCards, intrigueCards } = req.body;

    try {

        if (!name) {
            res.status(400).json({ message: 'Name must be specified' });
        }

        var decryptedImperiumRowCards = decryptId(imperiumRowCards);
        var decryptedIntrigueCards = decryptId(intrigueCards);

        const preset = await Preset.create({ name: name, key: uuidv4(), imperiumRowCards: decryptedImperiumRowCards, intrigueCards: decryptedIntrigueCards, users: [_id] });

        if (!preset) {
            res.status(400).json({ message: 'Error during preset save' });
        }

        await User.findOneAndUpdate({ _id: _id }, { $push: { presets: preset._id } });

        const updatedUser = await User.findById(_id, '-password')
            .populate({ path: 'presets', model: Preset, options: { collation: { 'locale': 'en' }, sort: { 'name': 1 } }, select: 'name key -_id' });

        res.json({ message: 'Preset saved', updatedPresets: updatedUser.presets });
    } catch (error) {
        next(error);
    }
}

// Load a preset by public key
export async function loadPreset(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id } = req.user;
    const { key } = req.body;

    try {
        if (!key) {
            res.status(400).json({ message: 'Invalid preset' });
        }

        var preset = await Preset.findOneAndUpdate({ key: key }, { $inc: { total: 1, thisWeek: 1 } });

        var updatedPreset = await Preset.findById(preset._id, 'imperiumRowCards, intrigueCards, -_id')
            .populate({ path: 'imperiumRowCards', model: ImperiumRowCard, options: { sort: { 'price': 1, 'name': 1 } }, select: 'name img copy price persuasion swords _id' })
            .populate({ path: 'intrigueCards', model: IntrigueCard, options: { sort: { 'phaseNumber': 1, 'name': 1 } }, select: 'name img copy _id' });

        var imperiumRowResults = updatedPreset.imperiumRowCards;
        var intrigueCardsResults = updatedPreset.intrigueCards;

        var results = {
            imperiumRowResults: encryptId(imperiumRowResults),
            intrigueCardsResults: encryptId(intrigueCardsResults),
        };

        res.status(200).json(results);
    } catch (error) {
        next(error);
    }
}

// Remove a preset from user's preset
export async function removePreset(req, res, next) {
    var user = req.user;
    var body = req.body;

    const { _id } = req.user;
    const { key } = req.body;

    try {
        if (!key) {
            res.status(400).json({ message: 'Invalid preset' });
        }

        var preset = await Preset.findOneAndUpdate({ key: key }, { $pull: { users: _id } });

        await User.updateOne({ _id: _id }, { $pull: { presets: preset._id } });

        const updatedUser = await User.findById(_id, '-password')
            .populate({ path: 'presets', model: Preset, options: { collation: { 'locale': 'en' }, sort: { 'name': 1 } }, select: 'name key -_id' });;

        res.json({ message: 'Preset removed', updatedPresets: updatedUser.presets });
    } catch (error) {
        next(error);
    }
}