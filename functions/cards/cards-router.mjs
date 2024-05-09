import { Router } from "express";
import axiosInstance from 'axios';
import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import { createImperiumQueryParams, createIntrigueQueryParams, createMultipleImperiumQueryParams, createMultipleIntrigueQueryParams } from "../utils/query-params-utils.mjs";
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { encryptId } from "../utils/id-encrypter.js";

dotenv.config();
const cardsRouter = Router();
const mongoUri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(mongoUri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

cardsRouter.post("/searchCards", async function (req, res) {
    try {

        var conn = await client.connect();
        var db = conn.db("cards");
        var imperiumRow = await db.collection("imperium_row");
        var intrigueCards = await db.collection("intrigue");

        var body = req.body;

        if (!body.filters) {
            res.status(400).json({ message: "No filters received" });
        } else {

            await updateSearches(body.filters);

            var params = JSON.parse(atob(body.filters));

            var imperiumParams = await createMultipleImperiumQueryParams(params);

            var imperiumRowResults = [];
            var intrigueCardsResults = [];

            imperiumRowResults = await imperiumRow.find(imperiumParams)
                .sort({ price: 1, name: 1 })
                .project({ _id: 1, name: 1, img: 1, copy: 1, price: 1, persuasion: 1, swords: 1 })
                .toArray();

            var intrigueParams = createMultipleIntrigueQueryParams(params);
            if (intrigueParams) {
                intrigueCardsResults = await intrigueCards.find(intrigueParams)
                    .sort({ phaseNumber: 1, name: 1 })
                    .project({ _id: 1, name: 1, img: 1, copy: 1 })
                    .toArray();
            }

            var results = {
                imperiumRowResults: encryptId(imperiumRowResults),
                intrigueCardsResults: encryptId(intrigueCardsResults),
            };

            res.status(200).json(results);
        }

    } catch (err) {
        res.status(400).json(err);
    }
});

async function updateSearches(filters) {
    var conn = await client.connect();
    var db = conn.db("cards");
    var searches = await db.collection("searches");

    var now = new Date();

    var query = { filters: filters };
    var update = {
        $set: { lastSearch: now },
        $setOnInsert: { filters: filters, firstSearch: now, key: uuidv4() },
        $inc: { total: 1, thisWeek: 1 }
    };
    var options = { upsert: true };

    searches.updateOne(query, update, options);
}

async function getParamsFormUUID(uuid) {
    var conn = await client.connect();
    var db = conn.db("cards");
    var searches = await db.collection("searches");
    var filters = null;

    filters = await intrigueCards.findOne(
        { key: uuid },
        { filters: 1 }
    );

    return filters;
}

export default cardsRouter;