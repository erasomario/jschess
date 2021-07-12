const Joi = require('joi');
const { validate } = require('../../utils/Validation')
const gameSrc = require('../game/game-mongoose')

const createGame = async (userId, raw) => {
    const obj = validate(Joi.object({
        opponentId: Joi.string().required(),
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

module.exports = { createGame }