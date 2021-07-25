const Joi = require('joi');
const { send } = require('../../utils/Sockets');
const { validate } = require('../../utils/Validation');
const makeGameDto = require('../game-dto/game-dto-model');
const gameSrc = require('../game/game-mongoose');
const { getAllAttackedByEnemy, getAllAttackedByMe, simulateMov, getBoard, getAttacked, includes, getCastling, isKingAttacked } = require("../../utils/Chess")

const findGameById = gameSrc.findGameById
const editGame = gameSrc.editGame

const createGame = async (userId, raw) => {
    const obj = validate(Joi.object({
        opponentId: Joi.string(),
        time: Joi.number().required(),
        addition: Joi.number().required(),
        color: Joi.string().required().valid('w', 'b', 'wb')
    }), raw)

    const game = {
        createdAt: new Date(),
        time: obj.time,
        addition: obj.addition
    }

    if (obj.color === 'w' || (obj.color === 'wb' && Math.random() <= 0.5)) {
        game.whiteId = userId;//me
        game.blackId = obj.opponentId;//choosen opponent
        game.createdBy = 'w';
    } else {
        game.whiteId = obj.opponentId;//choosen opponent
        game.blackId = userId;//me
        game.createdBy = 'b';
    }
    game.movs = []
    const savedGame = await gameSrc.saveGame(game)
    if (!game.whiteId) {
        try {
            botMove(savedGame)
        } catch (e) {
            console.log(e);
        }
    }
    return savedGame
}

const getElapsedTimes = game => {
    const rta = {
        wSecs: game.time * 60,
        bSecs: game.time * 60
    }

    if (game.movs.length > 2) {
        for (let i = 0; i < game.movs.length; i++) {
            if (i % 2 === 0) {
                if (game.movs[i].time) {
                    rta.wSecs -= game.movs[i].time
                    rta.wSecs += game.addition
                }
            } else {
                if (game.movs[i].time) {
                    rta.bSecs -= game.movs[i].time
                    rta.bSecs += game.addition
                }
            }
        }
        if (game.movs.length % 2 === 0) {
            rta.wSecs -= (Date.now() - game.lastMovAt.getTime()) / 1000
        } else {
            rta.bSecs -= (Date.now() - game.lastMovAt.getTime()) / 1000
        }
    }
    return rta
}

const timeout = async id => {
    const game = await findGameById(id)
    if (!game.result) {
        const times = getElapsedTimes(game)
        if (times.wSecs <= 0) {
            game.result = "b"
        } else if (times.bSecs <= 0) {
            game.result = "w"
        }
        if (game.result) {
            game.endType = "time"
            const savedGame = await editGame(game)
            send(game, 'gameChanged', await makeGameDto(savedGame))
        }
    }
}

const values = { p: 1, n: 3, b: 3.1, r: 5, q: 9, k: 4 }

const getPieceScore = piece => {
    return piece ? values[piece[1]] : 0
}

const getScore = (board, src, dest, myColor) => {
    const piece = board.inGameTiles[src[1]][src[0]]
    const newTiles = simulateMov(board.inGameTiles, src[0], src[1], dest[0], dest[1])
    const destPiece = board.inGameTiles[dest[1]][dest[0]]

    let mind = ""
    let score = 0
    const me = getAllAttackedByMe(newTiles, [piece, ...board.touched], myColor)
    me.forEach(s => {
        const sc = getPieceScore(newTiles[s[1]][s[0]])
        if (sc > 0) {
            score += sc
            mind += `+${sc} I can attack ${newTiles[s[1]][s[0]]}. `
        }
    })
    const en = getAllAttackedByEnemy(newTiles, [piece, ...board.touched], myColor)
    en.forEach(s => {
        const sc = getPieceScore(newTiles[s[1]][s[0]])
        if (sc > 0) {
            score -= sc * 3
            mind += `-${sc} I can loose ${newTiles[s[1]][s[0]]}. `
        }
    })

    if (destPiece) {
        const sc = getPieceScore(destPiece) * 2
        score += sc
        mind += `-${sc} I can capture ${destPiece}. `
    }
    return { score, mind }
}

const botMove = async (game) => {
    if (!game.result) {
        const board = getBoard(game.movs, game.movs.length)
        const touched = board.touched
        const tiles = board.inGameTiles
        const myColor = game.movs.length % 2 === 0 ? "w" : "b"

        const moves = []
        tiles.forEach((r, i) => r.forEach((c, j) => {
            if (c && c.slice(0, 1) === myColor) {
                const att = getAttacked(tiles, touched, myColor, j, i)
                if (att.length > 0) {
                    att.forEach(a => {
                        const score = getScore(board, [j, i], a, myColor)
                        moves.push({ src: [j, i], dest: a, ...score })
                    })
                }
            }
        }))

        const max = moves.reduce((max, m) => { console.log(m.score, max, Math.max(m.score, max)); return Math.max(m.score, max) }, Number.NEGATIVE_INFINITY)
        console.log(max)
        const cand = moves.filter(m => m.score === max)
        const mov = cand[Math.floor(Math.random() * cand.length)]
        console.log(":::::::::::::::::::::::::::::::");
        const smoves = moves.sort((a, b) => b.score - a.score)
        smoves.forEach(m => console.log(m))
        await createMove(game, myColor === "w" ? game.whiteId : game.blackId, mov.src, mov.dest)
    }
}

const createMove = async (game, playerId, src, dest, piece, prom) => {
    if (game.result) {
        throw Error("Game is over")
    }
    const myColor = playerId === game.whiteId ? "w" : "b"
    const myTurn = myColor === "w" ? game.movs.length % 2 === 0 : game.movs.length % 2 !== 0

    if (!myTurn) {
        throw Error("No es su turno para mover")
    }

    const board = getBoard(game.movs, game.movs.length)
    const touched = board.touched
    const tiles = board.inGameTiles

    if (!tiles[src[1]][src[0]]) {
        throw Error("Empty source")
    }
    if (piece) {
        if (tiles[src[1]][src[0]] !== piece) {
            throw Error(`Not the same piece ${tiles[src[1]][src[0]]} ${piece}`)
        }
    } else {
        piece = tiles[src[1]][src[0]]
    }
    if (piece.slice(0, 1) !== myColor) {
        throw Error("That piece is not yours")
    }

    if (includes(getCastling(tiles, touched, myColor, src[0], src[1]), dest[0], dest[1])) {
        game.movs.push({ sCol: src[0], sRow: src[1], dCol: dest[0], dRow: dest[1], cast: dest[0] === 6 ? "s" : "l" })
    } else if ((piece[1] === "p") && ((piece[0] === "w" && src[1] === 6) || (piece[0] === "b" && src[1] === 1))) {
        if (!prom) {
            prom = "q"
        }
        const attacked = getAttacked(tiles, touched, myColor, src[0], src[1])
        if (!includes(attacked, dest[0], dest[1])) {
            throw Error("Destination can't be reached")
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
            throw Error("Destination can't be reached")
        }
        game.movs.push({ sCol: src[0], sRow: src[1], dCol: dest[0], dRow: dest[1] })
    }

    const newBoard = getBoard(game.movs, game.movs.length)
    const newTouched = newBoard.touched
    const newTiles = newBoard.inGameTiles

    const kingAttacked = isKingAttacked(newTiles, newTouched, myColor === "w" ? "b" : "w")
    const possibleMoves = getAllAttackedByMe(newTiles, newTouched, myColor === "w" ? "b" : "w").length

    if (!kingAttacked && possibleMoves === 0) {
        game.result = "d"
        game.endType = "stale"
    } else if (kingAttacked && possibleMoves === 0) {
        game.result = myColor
        game.endType = "check"
    }

    setLabel(game.movs[game.movs.length - 1], tiles, kingAttacked, possibleMoves)

    if (game.movs.length > 2) {
        game.movs[game.movs.length - 1].time = (Date.now() - game.lastMovAt.getTime()) / 1000
    }

    if (game.movs.length >= 2) {
        game.lastMovAt = new Date()
    }

    const times = getElapsedTimes(game)
    if (times.wSecs <= 0) {
        game.result = "b"
        game.endType = "time"
    } else if (times.bSecs <= 0) {
        game.result = "w"
        game.endType = "time"
    }

    const savedGame = await editGame(game)
    send(savedGame, "gameChanged", await makeGameDto(savedGame))
    if ((savedGame.movs.length % 2 === 0 && !savedGame.whiteId) || (savedGame.movs.length % 2 !== 0 && !game.blackId)) {
        botMove(savedGame)
    }
    return null
}


const setLabel = (mov, board, kingAttacked, possibleMoves) => {
    const piece = board[mov.sRow][mov.sCol]
    const letters = ["a", "b", "c", "d", "e", "f", "g", "h"]
    const getTileName = (c, r) => `${letters[c]}${r + 1}`
    const capture = board[mov.dRow][mov.dCol]
    const suf = kingAttacked ? (possibleMoves > 0 ? "+" : "#") : ""
    if (mov.cast) {
        mov.label = (mov.cast === "s" ? "0-0" : "0-0-0") + suf
    } else {
        if (piece.slice(1, 2) === "p") {
            const prom = mov.prom ? `${mov.prom[1].toUpperCase()}` : ""
            if (capture) {
                mov.label = `${letters[mov.sCol]}x${getTileName(mov.dCol, mov.dRow)}${prom.slice(1, 2).toUpperCase()}${suf}`
            } else {
                mov.label = `${getTileName(mov.dCol, mov.dRow)}${prom}${suf}`
            }
        } else {
            mov.label = `${piece.slice(1, 2).toUpperCase()}${capture ? "x" : ""}${getTileName(mov.dCol, mov.dRow)}${suf}`
        }
    }
}

module.exports = {
    createGame,
    createMove,
    editGame,
    findGameById,
    getElapsedTimes,
    timeout
}