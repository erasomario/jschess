const Joi = require('joi');
const { validate } = require('../../utils/Validation');

const schema = Joi.object({
    id: Joi.string().required(),
    username: Joi.string().required(),
    hasPicture: Joi.boolean(),
})

const makeUserDto = ({ id, username, hasPicture }) => {
    return validate(schema, { id, username, hasPicture })
}

module.exports = makeUserDto