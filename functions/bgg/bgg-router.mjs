import { Router } from "express";
import axiosInstance from 'axios';

const BGGRouter = Router();

BGGRouter.get("/getBGGThreads", async function (req, res) {
    try {
        var recentThreads = (await axiosInstance.get(process.env.BGG_RECENT_THREADS)).data;

        var hottestThreads = (await axiosInstance.get(process.env.BGG_HOTTEST_THREADS)).data;

        var response = {
            recent: recentThreads.threads ? recentThreads.threads : [],
            hottest: hottestThreads.threads ? hottestThreads.threads : []
        };

        res.status(200).json(response);
    } catch (err) {
        res.status(400).json(err);
    }
});

export default BGGRouter;