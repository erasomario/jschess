const Joi = require('joi');
const { validate } = require('../../utils/Validation');

const movSchema = Joi.object({
    id: Joi.string(),
    sCol: Joi.number().required(),
    sRow: Joi.number().required(),
    dCol: Joi.number().required(),
    dRow: Joi.number().required(),
    cast: Joi.string().valid('l', 's'),
    prom: Joi.string(),
    label: Joi.string().required(),
    time: Joi.number(),
})

const gameSchema = Joi.object({
    id: Joi.string(),
    whiteId: Joi.string().required(),
    blackId: Joi.string().required(),
    createdBy: Joi.string().valid('w', 'b').required(),
    createdAt: Joi.date().required().default(Date.now),
    lastMovAt: Joi.date(),
    result: Joi.string().valid('w', 'b', 'd'),
    movs: Joi.array().items(movSchema),
    time: Joi.number(),
    addition: Joi.number(),
})

const makeGame = (obj) => {
    return validate(gameSchema, obj)
}

module.exports = makeGame