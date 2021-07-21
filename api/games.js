const express = require("express");
const makeGameDto = require("../model/game-dto/game-dto-model");
const { createGame, findGameById, timeout } = require("../model/game/game-controller");
const { createMove } = require("../model/move/move-controller");

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

router.post("/:id/moves", (req, res, next) => {
    createMove(req.params.id, req.user.id, req.body.src, req.body.dest, req.body.piece, req.body.prom, req.body.cast)
        .then(() => res.status(200).end())
        .catch(next)
})

router.post("/:id/timeout", (req, res, next) => {
    timeout(req.params.id)
        .then(() => res.status(200).end())
        .catch(next)
})

module.exports = router;