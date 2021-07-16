const express = require("express");
const { createGame } = require("../model/game/game-controller");
const { findGameById } = require("../model/game/game-mongoose");
const { createMove } = require("../model/move/move-controller");

var router = express.Router();

router.post("/", function (req, res, next) {
    createGame(req.user.id, req.body).then(game => res.json(game)).catch(next)
});

router.get("/:id", (req, res, next) => {
    findGameById(req.params.id)
        .then(g => res.json(g))
        .catch(next)
})

router.post("/:id/moves", (req, res, next) => {
    createMove(req.params.id, req.user.id, req.body.src, req.body.dest, req.body.piece, req.body.prom, req.body.cast)
        .then(g => res.json(g))
        .catch(next)
})

module.exports = router;