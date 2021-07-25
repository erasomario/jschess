const express = require("express");
const makeGameDto = require("../model/game-dto/game-dto-model");
const { createGame, createMove, findGameById, timeout } = require("../model/game/game-controller");

var router = express.Router();

router.post("/", function (req, res, next) {
    createGame(req.user.id, req.body)
        .then(makeGameDto)
        .then(game => res.json(game))
        .catch(next)
});

router.get("/:id", (req, res, next) => {
    findGameById(req.params.id)
        .then(makeGameDto)
        .then(g => res.json(g))
        .catch(next)
})

router.post("/:id/moves", async (req, res, next) => {
    const game = await findGameById(req.params.id)
    createMove(game, req.user.id, req.body.src, req.body.dest, req.body.piece, req.body.prom)
        .then(() => res.status(200).end())
        .catch(next)
})

router.post("/:id/timeout", (req, res, next) => {
    timeout(req.params.id)
        .then(() => res.status(200).end())
        .catch(next)
})

module.exports = router;