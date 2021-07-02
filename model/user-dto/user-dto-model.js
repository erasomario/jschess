const Joi = require('joi');

const schema = Joi.object({
    id: Joi.string(),
    email: Joi.string().email().required(),
    username: Joi.string().required()
})

const makeUserDto = ({id, email, username}) => {
    const { value, error } = schema.validate({id, email, username})
    if (error) {
        throw error
    }
    return value
}

module.exports = makeUserDto