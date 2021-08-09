const Joi = require('joi');
const { validate } = require('../../utils/Validation');
const { findUserById } = require('../user/user-logic');

const gamelistDtoSchema = Joi.object({
    id: Joi.string().required(),
    whiteId: Joi.string(),
    blackId: Joi.string(),
    whiteName: Joi.string(),
    blackName: Joi.string(),
    blackHasPicture: Joi.boolean(),
    whiteHasPicture: Joi.boolean(),
    createdAt: Joi.date().required().default(Date.now),
    lastMovAt: Joi.date(),
    result: Joi.string().valid('w', 'b', 'd'),
    time: Joi.number(),
    addition: Joi.number(),
    turn: Joi.number().required(),
    opponentNotified: Joi.boolean().required(),
    createdBy: Joi.string().valid('w', 'b'),
})

const makeGamelistDto = async game => {
    const obj = { ...game }
    if (!obj.whiteId) {
        obj.whiteName = "Robot"
        obj.whiteHasPicture = true
    }

    if (!obj.blackId) {
        obj.blackName = "Robot"
        obj.blackHasPicture = true
    }

    if (!obj.whiteName && obj.whiteId) {
        const white = await findUserById(obj.whiteId)
        obj.whiteName = white.username
        obj.whiteHasPicture = white.hasPicture
    }
    if (!obj.blackName && obj.blackId) {
        const black = await findUserById(obj.blackId)
        obj.blackName = black.username
        obj.blackHasPicture = black.hasPicture
    }
    obj.turn = game.movs.length    
    return validate(gamelistDtoSchema, obj)
}

module.exports = makeGamelistDto