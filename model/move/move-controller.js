const { getBoard, getCastling, includes, getAttacked, isKingAttacked, getAllAttackedByMe } = require("../../utils/Chess")
const { editGame, findGameById, getElapsedTimes } = require("../game/game-controller")
const { send } = require("../../utils/Sockets")
const makeGameDto = require("../game-dto/game-dto-model")

const createMove = async (gameId, playerId, src, dest, piece, prom, cast) => {
    const game = await findGameById(gameId)
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
    if (tiles[src[1]][src[0]] !== piece) {
        throw Error(`Not the same piece ${tiles[src[1]][src[0]]} ${piece}`)
    }
    if (piece.slice(0, 1) !== myColor) {
        throw Error("That piece is not yours")
    }

    if (cast) {
        if (!includes(getCastling(tiles, touched, myColor, src[0], src[1]), dest[0], dest[1])) {
            throw Error("invalid castling")
        }
        game.movs.push({ sCol: src[0], sRow: src[1], dCol: dest[0], dRow: dest[1], cast: dest[0] === 6 ? "s" : "l" })
    } else if (prom) {
        if (piece[1] !== "p") {
            throw Error("Promotion is only for pawns")
        }
        if ((piece[0] === "w" && src[1] !== 6) || (piece[0] === "b" && src[1] !== 1)) {
            throw Error("pawn is not on the right place to be promoted")
        }
        if ((piece[0] === "w" && tiles[7][src[0]]) || (piece[0] === "b" && tiles[0][src[0]])) {
            throw Error("destination is not empty")
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
    send([game.whiteId, game.blackId], "gameChanged", await makeGameDto(savedGame))
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
            const prom = mov.prom ? `${mov.prom.toUpperCase()}` : ""
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

module.exports = { createMove }