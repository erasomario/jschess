const Joi = require('joi')
const {encode} = require('./api-key-controller')

const schema = Joi.object({
    id: Joi.string().required(),
    email: Joi.string().email().required(),
    username: Joi.string().required()
})

const makeApiKey = ({id, email, username}) => {
    const { value, error } = schema.validate({id, email, username})
    if (error) {
        throw error
    }
    return { api_key: encode(value), ...value }
}

module.exports = makeApiKey