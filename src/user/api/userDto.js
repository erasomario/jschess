const Joi = require('joi');
const {validate} = require("../../../helpers/Validation");

const schema = Joi.object({
    id: Joi.string(),
    username: Joi.string().required().alphanum().trim().max(18).min(6),
    hasPicture: Joi.boolean(),
    boardOpts: Joi.string(),
    lang: Joi.string().valid("es", "en").required(),
    guest: Joi.boolean().required()
})

const makeUserDto = obj => {
    return validate(schema, obj)
}

module.exports = {makeUserDto}