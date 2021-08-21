const Joi = require('joi');
const { validate } = require('../../utils/Validation');

const schema = Joi.object({
    id: Joi.string().required(),
    username: Joi.string().required(),
    hasPicture: Joi.boolean(),
    lang: Joi.string().valid("es", "en"),
    guest: Joi.boolean().required()
})

const makeUserDto = obj => {
    return validate(schema, obj)
}

module.exports = makeUserDto