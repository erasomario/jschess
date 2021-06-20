const express = require("express")
const Game = require("../model/Games")
const { getBoard, getAttacked, getCastling, isKingAttacked } = require('../utils/Chess')
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

    /*game.pieces = {
        wr1: { 0: '11' }, wn1: { 0: '21' }, wb1: { 0: '31' }, wq1: { 0: '41' }, wk1: { 0: '51' }, wb2: { 0: '61' }, wn2: { 0: '71' }, wr2: { 0: '81' },
        wp1: { 0: '12' }, wp2: { 0: '22' }, wp3: { 0: '32' }, wp4: { 0: '42' }, wp5: { 0: '52' }, wp6: { 0: '62' }, wp7: { 0: '72' }, wp8: { 0: '82' },
        bp1: { 0: '17' }, bp2: { 0: '27' }, bp3: { 0: '37' }, bp4: { 0: '47' }, bp5: { 0: '57' }, bp6: { 0: '67' }, bp7: { 0: '77' }, bp8: { 0: '87' },
        br1: { 0: '18' }, bn1: { 0: '28' }, bb1: { 0: '38' }, bq1: { 0: '48' }, bk1: { 0: '58' }, bb2: { 0: '68' }, bn2: { 0: '78' }, br2: { 0: '88' }
    }*/

    game.pieces = {
        wr1: { 0: '11' }, wn1: { 0: '21' }, wb1: { 0: '31' }, wq1: { 0: '41' }, wk1: { 0: '51' }, wb2: { 0: '61' }, wn2: { 0: '71' }, wr2: { 0: '81' },
        wp1: { 0: '17' }, wp2: { 0: '22' }, wp3: { 0: '32' }, wp4: { 0: '42' }, wp5: { 0: '52' }, wp6: { 0: '62' }, wp7: { 0: '72' }, wp8: { 0: '82' },
        bp1: { 0: 'c' }, bp2: { 0: 'c' }, bp3: { 0: 'c' }, bp4: { 0: 'c' }, bp5: { 0: 'c' }, bp6: { 0: 'c' }, bp7: { 0: 'c' }, bp8: { 0: 'c' },
        br1: { 0: 'c' }, bn1: { 0: 'c' }, bb1: { 0: 'c' }, bq1: { 0: '48' }, bk1: { 0: '58' }, bb2: { 0: 'c' }, bn2: { 0: 'c' }, br2: { 0: 'c' }
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
                    const prom = req.body.prom

                    if (myTurn) {
                        //{piece: "wp4", src: "42", dest: "44", prom: 'q'}
                        const tiles = getBoard(game.pieces, mGame.turn).inGameTiles
                        if (tiles[src].piece === piece) {
                            if (piece.slice(0, 1) !== myColor) {
                                throw { error: 'That piece is not yours' }
                            }

                            mGame.turn++

                            const attacked = getAttacked(tiles, myColor, parseInt(src.slice(0, 1)), parseInt(src.slice(1, 2)))
                            if (dest && !attacked.includes(dest)) {
                                if (tiles[src].piece.slice(1, 2) === 'k') {
                                    if (getCastling(tiles, myColor, parseInt(src.slice(0, 1)), parseInt(src.slice(1, 2))).includes(dest)) {
                                        const destCol = dest.slice(0, 1)
                                        const destRow = dest.slice(1, 2)
                                        if (destCol === '3') {
                                            mGame.pieces[`${myColor}r1`].set(`${mGame.turn}`, `4${destRow}`)
                                        } else if (destCol === '7') {
                                            mGame.pieces[`${myColor}r2`].set(`${mGame.turn}`, `6${destRow}`)
                                        } else {
                                            throw { error: 'Unexpected castling ' + destCol }
                                        }
                                    } else {
                                        throw { error: 'square is not under attack' }
                                    }
                                } else {
                                    res.status(400).json({ error: 'La casilla no está bajo ataque' })
                                    return
                                }
                            }

                            if (prom) {
                                if (piece[1] !== 'p') {
                                    res.status(400).json({ error: 'Promotion is only for pawns' })
                                }
                                if ((piece[0] === 'w' && src[1] !== '7') || (piece[0] === 'b' && src[1] !== '2')) {
                                    res.status(400).json({ error: 'pawn is not on the right place to be promoted' })
                                }

                                if ((piece[0] === 'w' && tiles[`${src[0]}8`]) || (piece[0] === 'b' && tiles[`${src[0]}1`])) {
                                    res.status(400).json({ error: 'destination is not empty' })
                                }


                                const c = Object.keys(mGame.pieces).filter(p => p[0] === piece[0] && p[1] === prom).length + 1
                                mGame.pieces[piece].set(`${mGame.turn}`, piece[0] === 'w' ? `${src[0]}8` : `${src[0]}1`)

                                
                                mGame[`${piece[0]}${prom}${c}`] = mGame.pieces[piece]
                                delete mGame.pieces[piece]
                            } else {
                                if (tiles[dest]) {
                                    mGame.pieces[tiles[dest].piece].set(`${mGame.turn}`, 'c')
                                }
                            }

                            if (!prom) {
                                mGame.pieces[piece].set(`${mGame.turn}`, req.body.dest)
                            }

                            mGame.save((error, savedGame) => {
                                if (error) {
                                    res.status(500).end();
                                } else {
                                    res.status(200).json(Game.dto(savedGame))

                                    const newBoard = getBoard(savedGame.toObject({ flattenMaps: true, virtuals: true }).pieces, savedGame.turn).inGameTiles

                                    if (myColor === 'b' && connections.has(game.whitePlayerId)) {
                                        console.log("Notifing white player");
                                        let msg = `${mGame.whiteId.username} hizo una jugada`
                                        if (isKingAttacked(newBoard, myColor === 'w' ? 'b' : 'w')) {
                                            msg += '. Su rey está en jaque'
                                        }
                                        connections.get(game.whitePlayerId).emit('gameTurnChanged', { id: game.id, msg })
                                    }
                                    if (myColor === 'w' && connections.has(game.blackPlayerId)) {
                                        console.log("Notifing black player");
                                        let msg = `${mGame.blackId.username} hizo una jugada`
                                        if (isKingAttacked(newBoard, myColor === 'w' ? 'b' : 'w')) {
                                            msg += '. Su rey está en jaque'
                                        }
                                        connections.get(game.blackPlayerId).emit('gameTurnChanged', { id: game.id, msg })
                                    }
                                }
                            })
                        } else {
                            res.status(400).json({ error: 'La pieza no está en el lugar que indica' })
                        }
                    } else {
                        res.status(400).json({ error: 'No es su turno para mover' })
                    }
                } catch (e) {
                    console.log(e)
                    if (typeof e === 'object' && e !== null) {
                        res.status(500).json(e)
                    } else {
                        res.status(500).json()
                    }
                }
            }
        })
})

module.exports = router;