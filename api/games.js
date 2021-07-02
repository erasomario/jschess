const express = require("express")
const Game = require("../oldmodel/Games")
const { getBoard, getAttacked, getCastling, includes, getAllAttackedByMe, isKingAttacked } = require('../utils/Chess')
const { send } = require('../utils/Sockets');
var router = express.Router();

router.post("/", function (req, res) {
    const game = new Game()
    
    if (!req.body.color) {
        throw { error: 'Request should specify a color' }
    }
    if (['w', 'b', 'wb'].includes(req.body.color)) {
        throw { error: 'Color shoud be w b or wb' }
    }
    if (req.body.time) {
        throw { error: 'Request should include a time' }
    }

    if (req.body.color === 'w' || (req.body.color === 'wb' && Math.random() <= 0.5)) {
        game.whiteId = req.user.id;//me
        game.blackId = req.body.userId;//choosen opponent
        game.createdBy = 'w';
    } else {
        game.whiteId = req.body.userId;//choosen opponent
        game.blackId = req.user.id;//me
        game.createdBy = 'b';
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

                    } else {
                        const attacked = getAttacked(tiles, touched, myColor, src[0], src[1])
                        if (!includes(attacked, dest[0], dest[1])) {
                            throw { error: "Destination can't be reached" }
                        }

                        game.movs.push({ sCol: src[0], sRow: src[1], dCol: dest[0], dRow: dest[1] })
                    }

                    const newBoard = getBoard(game.movs, game.movs.length)
                    const newTouched = newBoard.touched
                    const newTiles = newBoard.inGameTiles

                    const kingAttacked = isKingAttacked(newTiles, newTouched, myColor === 'w' ? 'b' : 'w')
                    const possibleMoves = getAllAttackedByMe(newTiles, newTouched, myColor === 'w' ? 'b' : 'w').length

                    if (!kingAttacked && possibleMoves === 0) {
                        game.result = 'd'
                    } else if (kingAttacked && possibleMoves === 0) {
                        game.result = myColor
                    }

                    setLabel(game.movs[game.movs.length - 1], tiles, kingAttacked, possibleMoves)

                    game.save((error, savedGame) => {
                        if (error) {
                            console.log(error);
                            res.status(500).end();
                        } else {
                            res.status(200).json(Game.dto(savedGame))
                            if (game.result) {
                                //notify both that the game is over
                            } else {
                                let msg = `${myColor === 'b' ? game.blackId.username : game.whiteId.username} hizo una jugada`
                                console.log(`Notifing ${myColor === 'b' ? 'white' : 'black'} player`);
                                send([myColor === 'b' ? game.whiteId.id : game.blackId.id], 'gameTurnChanged', { id: game.id, msg })
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

const setLabel = (mov, board, kingAttacked, possibleMoves) => {
    const piece = board[mov.sRow][mov.sCol]
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const getTileName = (c, r) => `${letters[c]}${r + 1}`
    const capture = board[mov.dRow][mov.dCol]
    const suf = kingAttacked ? (possibleMoves > 0 ? '+' : '#') : ''
    if (mov.cast) {
        mov.label = (mov.cast === 's' ? '0-0' : '0-0-0') + suf
    } else {
        if (piece.slice(1, 2) === 'p') {
            const prom = mov.prom ? `${mov.prom.toUpperCase()}` : ''
            if (capture) {
                mov.label = `${letters[mov.sCol]}x${getTileName(mov.dCol, mov.dRow)}${prom.slice(1, 2).toUpperCase()}${suf}`
            } else {
                mov.label = `${getTileName(mov.dCol, mov.dRow)}${prom}${suf}`
            }
        } else {
            mov.label = `${piece.slice(1, 2).toUpperCase()}${capture ? 'x' : ''}${getTileName(mov.dCol, mov.dRow)}${suf}`
        }
    }
}

module.exports = router;