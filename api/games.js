const express = require("express")
const Game = require("../model/Games")
const { getBoard, getAttacked, getCastling } = require('../utils/Chess')
const connections = require('../model/Sockets')
var router = express.Router();

router.post("/", function (req, res) {
    const game = new Game()
    const rand = Math.random()
    if (rand <= 0.5) {
        game.whiteId = req.body.userId;//choosen opponent
        game.blackId = req.user.id;//me
        game.createdBy = 'b';
    } else {
        game.whiteId = req.user.id;//me
        game.blackId = req.body.userId;//choosen opponent
        game.createdBy = 'w';
    }

    game.pieces = {
        wr1: { 0: '11' }, wn1: { 0: '21' }, wb1: { 0: '31' }, wq1: { 0: '41' }, wk1: { 0: '51' }, wb2: { 0: '61' }, wn2: { 0: '71' }, wr2: { 0: '81' },
        wp1: { 0: '12' }, wp2: { 0: '22' }, wp3: { 0: '32' }, wp4: { 0: '42' }, wp5: { 0: '52' }, wp6: { 0: '62' }, wp7: { 0: '72' }, wp8: { 0: '82' },
        bp1: { 0: '17' }, bp2: { 0: '27' }, bp3: { 0: '37' }, bp4: { 0: '47' }, bp5: { 0: '57' }, bp6: { 0: '67' }, bp7: { 0: '77' }, bp8: { 0: '87' },
        br1: { 0: '18' }, bn1: { 0: '28' }, bb1: { 0: '38' }, bq1: { 0: '48' }, bk1: { 0: '58' }, bb2: { 0: '68' }, bn2: { 0: '78' }, br2: { 0: '88' }
    }
    game.save((error, game) => {
        if (error) {
            console.log(error);
            res.status(500).end()
        } else {
            res.status(200).json(game)
        }
    })
});

router.get("/:id", (req, res) => {
    Game.findById(req.params.id)
        .populate('whiteId')
        .populate('blackId')
        .exec((error, data) => {
            if (error) {
                res.status(500).json(error)
            } else if (data) {
                res.status(200).json(Game.dto(data))
            }
        });
});

router.post("/:id/moves", (req, res) => {

    Game.findById(req.params.id)
        .populate('whiteId')
        .populate('blackId')
        .exec((error, mGame) => {
            if (error) {
                res.status(500).end();
            } else if (!mGame) {
                res.status(400).json({ error: "No se encontró el juego" });
            } else {
                try {
                    const game = Game.dto(mGame.toObject({ flattenMaps: true, virtuals: true }))
                    const myColor = req.user.id === game.whitePlayerId ? 'w' : 'b'
                    const myTurn = myColor === 'w' ? game.turn % 2 === 0 : game.turn % 2 !== 0
                    const src = req.body.src
                    const dest = req.body.dest
                    const piece = req.body.piece

                    if (myTurn) {
                        //{piece: "wp4", src: "42", dest: "44"}
                        const tiles = getBoard(game.pieces, mGame.turn).inGameTiles

                        if (tiles[src].piece === piece) {
                            const attacked = getAttacked(tiles, myColor, parseInt(src.slice(0, 1)), parseInt(src.slice(1, 2)))
                            if (attacked.includes(req.body.dest)) {
                                mGame.turn++
                                if (tiles[dest]) {
                                    mGame.pieces[tiles[dest].piece].set(`${mGame.turn}`, 'c')
                                }
                                mGame.pieces[piece].set(`${mGame.turn}`, req.body.dest)
                                mGame.save((error, savedGame) => {
                                    if (error) {
                                        res.status(500).end();
                                    } else {
                                        res.status(200).json(Game.dto(savedGame))
                                        if (myColor === 'b' && connections.has(game.whitePlayerId)) {
                                            console.log("Notifing white player");
                                            connections.get(game.whitePlayerId).emit('gameTurnChanged', { id: game.id })
                                        }
                                        if (myColor === 'w' && connections.has(game.blackPlayerId)) {
                                            console.log("Notifing black player");
                                            connections.get(game.blackPlayerId).emit('gameTurnChanged', { id: game.id })
                                        }
                                    }
                                })
                            } else {
                                res.status(400).json({ error: 'La casilla no está bajo ataque' })
                            }
                        } else {
                            res.status(400).json({ error: 'La pieza no está en el lugar que indica' })
                        }
                    } else {
                        res.status(400).json({ error: 'No es su turno para mover' })
                    }
                } catch (e) {
                    console.log(e)
                    res.status(500).end()
                }
            }
        })
})

module.exports = router;