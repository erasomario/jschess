const express = require("express")
const Game = require("../model/Games")
const { getBoard, getAttacked, getCastling, includes, getAllAttackedByMe, isKingAttacked } = require('../utils/Chess')
const { send } = require('../model/Sockets')
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
    game.movs = []
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
        .exec((error, game) => {
            try {
                if (error) {
                    res.status(500).end();
                } else if (!game) {
                    res.status(400).json({ error: "No se encontró el juego" });
                } else {
                    const myColor = req.user.id === game.whiteId.id ? 'w' : 'b'
                    console.log(myColor);
                    const myTurn = myColor === 'w' ? game.movs.length % 2 === 0 : game.movs.length % 2 !== 0
                    const src = req.body.src
                    const dest = req.body.dest
                    const piece = req.body.piece
                    const prom = req.body.prom
                    const cast = req.body.cast

                    if (!myTurn) {
                        res.status(400).json({ error: 'No es su turno para mover' })
                        return
                    }

                    let board = getBoard(game.movs, game.movs.length)
                    let touched = board.touched
                    let tiles = board.inGameTiles

                    let label
                    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
                    const getTileName = (c, r) => `${letters[c]}${r + 1}`

                    console.log('tyring to save');

                    if (!tiles[src[1]][src[0]]) {
                        throw { error: 'Empty source' }
                    }
                    if (tiles[src[1]][src[0]] !== piece) {
                        throw { error: `Not the same piece ${tiles[src[1]][src[0]]} ${piece}` }
                    }
                    if (piece.slice(0, 1) !== myColor) {
                        throw { error: 'That piece is not yours' }
                    }

                    if (cast) {
                        if (!includes(getCastling(tiles, touched, myColor, src[0], src[1]), dest[0], dest[1])) {
                            throw { error: 'invalid castling' }
                        }
                        label = (dest[0] === 6 ? '0-0' : '0-0-0')
                        game.movs.push({ sCol: src[0], sRow: src[1], dCol: dest[0], dRow: dest[1], cast: dest[0] === 6 ? 's' : 'l' })
                    } else if (prom) {
                        if (piece[1] !== 'p') {
                            throw { error: 'Promotion is only for pawns' }
                        }
                        if ((piece[0] === 'w' && src[1] !== 6) || (piece[0] === 'b' && src[1] !== 1)) {
                            throw { error: 'pawn is not on the right place to be promoted' }
                        }
                        if ((piece[0] === 'w' && tiles[7][src[0]]) || (piece[0] === 'b' && tiles[0][src[0]])) {
                            throw { error: 'destination is not empty' }
                        }

                        let pieces = 0
                        tiles.forEach(row => row.forEach(p => {
                            if (p && (p.slice(0, 1) === myColor && p.slice(1, 2) === prom)) {
                                pieces++
                            }
                        }))
                        game.movs.push({ sCol: src[0], sRow: src[1], dCol: dest[0], dRow: dest[1], prom: `${myColor}${prom}${pieces + 1}` })
                        label = getTileName(dest[0], dest[1]) + "=" + prom.toUpperCase()
                    } else {
                        const attacked = getAttacked(tiles, touched, myColor, src[0], src[1])
                        if (!includes(attacked, dest[0], dest[1])) {
                            throw { error: "Destination can't be reached" }
                        }
                        const capture = tiles[dest[1]][dest[0]]
                        if (piece.slice(1, 2) === 'p') {
                            if (capture) {
                                label = `${letters[src[0]]}x${getTileName(dest[0], dest[1])}`
                            } else {
                                label = getTileName(dest[0], dest[1])
                            }
                        } else {
                            label = `${piece.slice(1, 2).toUpperCase()}${capture ? 'x' : ''}${getTileName(dest[0], dest[1])}`
                        }
                        game.movs.push({ sCol: src[0], sRow: src[1], dCol: dest[0], dRow: dest[1] })
                    }


                    board = getBoard(game.movs, game.movs.length)
                    touched = board.touched
                    tiles = board.inGameTiles


                    const kingAttacked = isKingAttacked(tiles, touched, myColor === 'w' ? 'b' : 'w')
                    const possibleMoves = getAllAttackedByMe(tiles, touched, myColor === 'w' ? 'b' : 'w').length

                    if (!label) {
                        throw { error: "No label has been defined for that movement" }
                    }

                    if (!kingAttacked && possibleMoves === 0) {
                        game.result = 'd'
                        label += '1/2'
                    } else if (kingAttacked && possibleMoves === 0) {
                        game.result = myColor
                        label += ('++' + myColor == 'w' ? '1-0' : '0-1')
                    } else if (kingAttacked) {
                        label += '+'
                    }


                    game.movs[game.movs.length - 1].label = label

                    game.save((error, savedGame) => {
                        if (error) {
                            console.log(error);
                            res.status(500).end();
                        } else {
                            res.status(200).json(Game.dto(savedGame))

                            if (myColor === 'b') {
                                console.log("Notifing white player");
                                let msg = `${game.blackId.username} hizo una jugada`
                                send([game.whiteId.id], 'gameTurnChanged', { id: game.id, msg })
                            }
                            if (myColor === 'w') {
                                console.log("Notifing black player");
                                let msg = `${game.whiteId.username} hizo una jugada`
                                send([game.blackId.id], 'gameTurnChanged', { id: game.id, msg })
                            }
                        }
                    })
                }
            } catch (e) {
                console.log('something went wrong');
                console.log(e)
                if (e && (typeof e === 'object')) {
                    res.status(500).json(e)
                } else {
                    res.status(500).json()
                }
            }
        })
})

module.exports = router;