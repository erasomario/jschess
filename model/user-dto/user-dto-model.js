const Joi = require('joi');

const schema = Joi.object({
    id: Joi.string().required(),
    username: Joi.string().required(),
    hasPicture: Joi.boolean(),
})

const makeUserDto = ({id, username, hasPicture}) => {
    const { value, error } = schema.validate({id, username, hasPicture})
    if (error) {
        throw error
    }
    return value
}

module.exports = makeUserDto