const Joi = require('joi');
const { validate } = require('../../utils/Validation');
const { gameSchema } = require('../game/game-model');
const { findUserById } = require('../user/user-controller');

const gameDtoSchema = gameSchema.append({
    whiteName: Joi.string(),
    blackName: Joi.string(),
    whiteHasPicture: Joi.boolean(),
    blackHasPicture: Joi.boolean(),
})

const makeGameDto = async (obj) => {
    if (!obj.whiteId) {
        obj.whiteName = "Autómata"
    }

    if (!obj.blackId) {
        obj.blackName = "Autómata"
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
    return validate(gameDtoSchema, obj)
}

module.exports = makeGameDto