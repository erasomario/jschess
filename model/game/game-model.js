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
    whiteId: Joi.string(),
    blackId: Joi.string(),
    createdBy: Joi.string().valid('w', 'b').required(),
    createdAt: Joi.date().required().default(Date.now),
    lastMovAt: Joi.date(),
    result: Joi.string().valid('w', 'b', 'd'),
    endType: Joi.string().valid('time','check', 'stale', 'material', 'agreed', 'surrender'),
    movs: Joi.array().items(movSchema),
    time: Joi.number(),
    addition: Joi.number(),
    requestedColor: Joi.string().valid('w', 'wb', 'd').required(),
    opponentNotified: Joi.boolean().default(false).required(),
    drawOfferedBy: Joi.string().valid('w', 'b')
})

const makeGame = (obj) => {
    return validate(gameSchema, obj)
}

module.exports = { makeGame, gameSchema, movSchema }