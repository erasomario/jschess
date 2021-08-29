const Joi = require('joi')
const {sendToGame, sendToUser} = require('../../../helpers/Sockets')
const {validate} = require('../../../helpers/Validation')
const {findUserById} = require('../../user/interactors/userInteractors')
const i18n = require('i18next')

const makeGameInteractor = gameRepo => {
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
        const savedGame = await gameRepo.saveGame(game)

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
            await gameRepo.editGame(game)
        }
        await sendNotNotifiedCount(userId)
    }

    const sendNotNotifiedCount = async userId => {
        sendToUser(userId, "opponentNotificationUpdated", await gameRepo.findNotNotifiedGamesCount(userId))
    }

    const surrender = async (userId, gameId) => {
        const t = i18n.getFixedT(userId ? (await findUserById(userId)).lang : "en")
        const game = await gameRepo.findGameById(gameId)
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
        await sendToGame(game, "gameChanged", savedGame)
    }

    const offerDraw = async (userId, gameId) => {
        const t = i18n.getFixedT(userId ? (await findUserById(userId)).lang : "en")
        const game = await gameRepo.findGameById(gameId)
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
        const game = await gameRepo.findGameById(gameId)
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
        await sendToGame(game, "gameChanged", savedGame)
    }

    const rejectDraw = async (userId, gameId) => {
        const t = i18n.getFixedT(userId ? (await findUserById(userId)).lang : "en")
        const game = await gameRepo.findGameById(gameId)
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
        const game = await gameRepo.findGameById(gameId)
        if (!game.subscribers) {
            game.subscribers = []
        }
        if (!game.subscribers.includes(userId)) {
            game.subscribers.push(userId)
        }
        await gameRepo.editGame(game)
        return game
    }

    const editGame = g => gameRepo.editGame(g)
    const findGameById = gId => gameRepo.findGameById(gId)
    const findGamesByStatus = (userId, status) => gameRepo.findGamesByStatus(userId, status)
    const findCurrentGames = userId => gameRepo.findCurrentGames(userId)
    const findNotNotifiedGamesCount = userId => gameRepo.findNotNotifiedGamesCount(userId)

    return {
        createGame,
        createSubscriber,
        editGame,
        findGameById,
        findGamesByStatus,
        findCurrentGames,
        setOpponentNotification,
        findNotNotifiedGamesCount,
        sendNotNotifiedCount,
        offerDraw,
        acceptDraw,
        rejectDraw,
        surrender
    }
}
module.exports = makeGameInteractor