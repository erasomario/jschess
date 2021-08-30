const Joi = require('joi')
const {validate} = require("../../../helpers/Validation");

const schema = Joi.object({
    opponentId: Joi.string(),
    time: Joi.number().required(),
    addition: Joi.number().required(),
    color: Joi.string().required().valid('w', 'b', 'wb')
})

const makeCreateGameDto = raw => {
    return validate(schema, raw)
}

module.exports = {makeCreateGameDto}