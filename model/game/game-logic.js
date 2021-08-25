const Joi = require('joi')
const gameSrc = require('./game-mongo')
const { sendToGame, sendToUser } = require('../../utils/Sockets')
const { validate } = require('../../utils/Validation')
const makeGameDto = require('../game-dto/game-dto-model')
const { getAllAttackedByMe, getBoard, getAttacked, includes, getCastling, isKingAttacked, checkEnoughMaterial, getBoardHash } = require("../../utils/Chess")
const { generateBotMove } = require('../bot/bot')
const { findUserById } = require('../user/user-mongo')
const i18n = require('i18next')

const findGameById = gameSrc.findGameById
const editGame = gameSrc.editGame
const findGamesByStatus = gameSrc.findGamesByStatus

const botMove = async game => {
    const m = await generateBotMove(game)
    if (m) {
        await createMove(game, m.userId, m.src, m.dest)
    }
}

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
        addition: obj.addition,
        requestedColor: obj.color,
        opponentNotified: !obj.opponentId
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

    //if I'm playing against the bot and it's playing white, it's its turn to start
    if (!game.whiteId) {
        setTimeout(async () => {
            try {
                await botMove(savedGame)
            } catch (e) {
                console.log(e)
            }
        }, 500)
    }

    //letting know the other player that I'm inviting him to a game
    if (obj.opponentId) {
        sendNotNotifiedCount(obj.opponentId)
    }
    return savedGame
}

const getElapsedTimes = game => {
    const rta = {
        wSecs: game.time * 60,
        bSecs: game.time * 60
    }

    if (game.movs.length >= 2) {
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
    if (!game.result && game.time) {
        const times = getElapsedTimes(game)
        if (times.wSecs <= 0) {
            game.result = "b"
        } else if (times.bSecs <= 0) {
            game.result = "w"
        }
        if (game.result) {
            game.endType = "time"
            const savedGame = await editGame(game)
            sendToGame(game, 'gameChanged', await makeGameDto(savedGame))
        }
    }
}

const createMove = async (game, playerId, src, dest, piece, prom) => {
    const t = i18n.getFixedT(playerId ? (await findUserById(playerId)).lang : "en")

    if (game.result) {
        throw Error(t("game is over"))
    }
    const myColor = playerId === game.whiteId ? "w" : "b"
    const myTurn = myColor === "w" ? game.movs.length % 2 === 0 : game.movs.length % 2 !== 0

    if (!myTurn) {
        throw Error(t("it's not your turn to move"))
    }

    const board = getBoard(game.movs, game.movs.length)
    const touched = board.touched
    const tiles = board.inGameTiles

    if (!tiles[src[1]][src[0]]) {
        throw Error(t("source square is empty"))
    }
    if (piece) {
        if (tiles[src[1]][src[0]] !== piece) {
            throw Error(t("piece is not at the designated origin square"))
        }
    } else {
        piece = tiles[src[1]][src[0]]
    }
    if (piece.slice(0, 1) !== myColor) {
        throw Error(t("you're trying to move a piece that's not yours"))
    }

    if (includes(getCastling(tiles, touched, myColor, src[0], src[1]), dest[0], dest[1])) {
        game.movs.push({ sCol: src[0], sRow: src[1], dCol: dest[0], dRow: dest[1], cast: dest[0] === 6 ? "s" : "l" })
    } else if ((piece[1] === "p") && ((piece[0] === "w" && src[1] === 6) || (piece[0] === "b" && src[1] === 1))) {
        if (!prom) {
            prom = "q"
        }
        const attacked = getAttacked(tiles, touched, myColor, src[0], src[1])
        if (!includes(attacked, dest[0], dest[1])) {
            throw Error(t("you can't move the piece to that square"))
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
            throw Error(t("you can't move the piece to that square"))
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
    
    const hash = getBoardHash(newBoard)
    game.movs[game.movs.length - 1].boardHash = hash

    let reps = 0
    game.movs.forEach((m, i) => {
        if (i < game.movs.length - 2 && m.boardHash === hash) {
            reps++
        }
    })
    //it's 2 cos I need to find another to hashes like mine to make it 3    
    if (reps === 2) {
        game.result = "d"
        game.endType = "threefold"
    }

    if (!game.result && game.time) {
        const times = getElapsedTimes(game)
        if (times.wSecs <= 0) {
            game.result = "b"
            game.endType = "time"
        } else if (times.bSecs <= 0) {
            game.result = "w"
            game.endType = "time"
        }
    }

    if (!game.result) {
        if (!checkEnoughMaterial(newTiles)) {
            game.result = "w"
            game.endType = "material"
        }
    }

    await editGame(game)
    if ((game.movs.length % 2 === 0 && !game.whiteId) || (game.movs.length % 2 !== 0 && !game.blackId)) {
        setTimeout(async () => {
            try {
                await botMove(game)
            } catch (e) {
                console.log(e)
            }
        }, 1500)
    }
    sendToGame(game, "gameChanged", await makeGameDto(game))
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

const undefinedAsNull = v => v === undefined ? null : v

const getMyColor = (userId, game, t) => {
    if (undefinedAsNull(userId) === undefinedAsNull(game.whiteId)) {
        return "w"
    } else if (undefinedAsNull(userId) === undefinedAsNull(game.blackId)) {
        return "b"
    } else {
        throw Error(t("you're not playing this game"))
    }
}

const setOpponentNotification = async (userId, gameId) => {
    const game = await findGameById(gameId)
    const t = i18n.getFixedT(userId ? (await findUserById(userId)).lang : "en")
    if (!game.opponentNotified) {
        const myColor = getMyColor(userId, game, t)
        if (game.createdBy === myColor) {
            throw Error(t("you're not the opponent on this game"))
        }
        game.opponentNotified = true
        await gameSrc.editGame(game)
    }
    await sendNotNotifiedCount(userId)
}

const sendNotNotifiedCount = async userId => {
    sendToUser(userId, "opponentNotificationUpdated", await gameSrc.findNotNotifiedGamesCount(userId))
}

const surrender = async (userId, gameId) => {
    const t = i18n.getFixedT(userId ? (await findUserById(userId)).lang : "en")
    const game = await gameSrc.findGameById(gameId)
    const myColor = getMyColor(userId, game, t)
    if (game.result) {
        throw Error(t("game is over"))
    }

    if (game.movs.length < 2) {
        throw Error(t("this game that hasn't started yet"))
    }
    game.result = (myColor === "w" ? "b" : "w")
    game.endType = "surrender"
    const savedGame = await editGame(game)
    sendToGame(game, "gameChanged", await makeGameDto(savedGame))
}

const offerDraw = async (userId, gameId) => {
    const t = i18n.getFixedT(userId ? (await findUserById(userId)).lang : "en")
    const game = await gameSrc.findGameById(gameId)
    const myColor = getMyColor(userId, game, t)
    if (game.movs.length < 2) {
        throw Error(t("this game that hasn't started yet"))
    }
    game.drawOfferedBy = myColor
    await editGame(game)
    if ((myColor === "w" && !game.blackId) || (myColor === "b" && !game.whiteId)) {
        await rejectDraw(null, gameId)
    } else {
        sendToUser(myColor === "w" ? game.blackId : game.whiteId, "drawOffered", game.id)
    }
}

const acceptDraw = async (userId, gameId) => {
    const t = i18n.getFixedT(userId ? (await findUserById(userId)).lang : "en")
    const game = await gameSrc.findGameById(gameId)
    const myColor = getMyColor(userId, game, t)
    if (!game.drawOfferedBy) {
        throw Error(t("there's not draw offering to accept"))
    }
    if (game.drawOfferedBy === myColor) {
        throw Error(t("you cannot accept or reject this draw offering"))
    }
    game.result = "d"
    game.endType = "agreed"
    const savedGame = await editGame(game)
    sendToGame(game, "gameChanged", await makeGameDto(savedGame))
}

const rejectDraw = async (userId, gameId) => {
    const t = i18n.getFixedT(userId ? (await findUserById(userId)).lang : "en")
    const game = await gameSrc.findGameById(gameId)
    const myColor = getMyColor(userId, game, t)
    if (!game.drawOfferedBy) {
        throw Error(t("there's not draw offering to reject"))
    }
    if (game.drawOfferedBy === myColor) {
        throw Error(t("you cannot accept or reject this draw offering"))
    }
    game.drawOfferedBy = undefined
    await editGame(game)
    sendToUser(myColor === "w" ? game.blackId : game.whiteId, "drawRejected", game.id)
}

const createSubscriber = async (userId, gameId) => {
    const game = await gameSrc.findGameById(gameId)
    if (!game.subscribers) {
        game.subscribers = []
    }
    if (!game.subscribers.includes(userId)) {
        game.subscribers.push(userId)
    }
    editGame(game)
    return game
}

module.exports = {
    createGame,
    createMove,
    createSubscriber,
    editGame,
    findGameById,
    findGamesByStatus,
    findCurrentGames: gameSrc.findCurrentGames,
    getElapsedTimes,
    setOpponentNotification,
    findNotNotifiedGamesCount: gameSrc.findNotNotifiedGamesCount,
    sendNotNotifiedCount,
    timeout,
    offerDraw,
    acceptDraw,
    rejectDraw,
    surrender
}