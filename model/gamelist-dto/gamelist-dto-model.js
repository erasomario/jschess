const Joi = require('joi');
const { validate } = require('../../utils/Validation');

const gameSchema = Joi.object({
    id: Joi.string().required(),
    whiteId: Joi.string().required(),
    blackId: Joi.string().required(),
    whiteName: Joi.string().required(),
    blackName: Joi.string().required(),
    createdAt: Joi.date().required().default(Date.now),
    lastMovAt: Joi.date(),
    result: Joi.string().valid('w', 'b', 'd'),
    time: Joi.number(),
    addition: Joi.number(),
    turn: Joi.number().required(),
})

const makeGamelistDto = (obj) => {
    return validate(gameSchema, obj)
}

module.exports = makeGamelistDto