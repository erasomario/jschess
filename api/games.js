const express = require("express");
const Joi = require("joi");
const makeGameDto = require("../model/game-dto/game-dto-model");
const { createGame, createMove, findGameById, timeout, setOpponentNotification, offerDraw, surrender, rejectDraw, acceptDraw } = require("../model/game/game-controller");
const { validate } = require("../utils/Validation");

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

router.post("/:id/opponentNotification", (req, res, next) => {
    setOpponentNotification(req.user.id, req.params.id)
        .then(() => res.end())
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

router.post("/:id/drawOffering", function (req, res, next) {
    offerDraw(req.user.id, req.params.id)
        .then(() => res.end())
        .catch(next)
});

router.put("/:id/drawOffering", function (req, res, next) {
    try {
        validate(Joi.object({ result: Joi.string().valid('accept', 'reject').required() }), req.body)
    } catch (e) {
        next(e)
    }
    const fx = req.body.result === "accept" ? acceptDraw : rejectDraw
    fx(req.user.id, req.params.id)
        .then(() => res.end())
        .catch(next)
});

router.post("/:id/surrender", async function (req, res, next) {
    surrender(req.user.id, req.params.id)
        .then(() => res.end())
        .catch(next)
});

module.exports = router;