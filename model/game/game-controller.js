const Joi = require('joi');
const { send } = require('../../utils/Sockets');
const { validate } = require('../../utils/Validation');
const makeGameDto = require('../game-dto/game-dto-model');
const gameSrc = require('../game/game-mongoose')

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
    return gameSrc.saveGame(game)
}


const timeout = async id => {
    const game = await findGameById(id)

    let wSecs = game.time * 60
    let bSecs = game.time * 60

    for (let i = 0; i < game.movs.length; i++) {
        if (i % 2 === 0) {
            if (game.movs[i].time) {
                wSecs -= game.movs[i].time
                wSecs += game.addition
            }
        } else {
            if (game.movs[i].time) {
                bSecs -= game.movs[i].time
                bSecs += game.addition
            }
        }
    }

    if (game.movs.length % 2 === 0) {
        wSecs -= (Date.now() - game.lastMovAt.getTime()) / 1000
    } else {
        bSecs -= (Date.now() - game.lastMovAt.getTime()) / 1000
    }

    if (wSecs <= 0) {
        game.result = "b"
    } else if (bSecs <= 0) {
        game.result = "w"
    }
    if (game.result) {
        game.endType = "time"
        const savedGame = await editGame(game)
        send([game.whiteId, game.blackId], 'gameTurnChanged', { game: await makeGameDto(savedGame), msg: "" })
    }
}

const findGameById = gameSrc.findGameById
const editGame = gameSrc.editGame

module.exports = {
    createGame,
    editGame,
    findGameById,
    timeout
}