const Joi = require('joi')
const { validate } = require('../../utils/Validation')
const { encode } = require('./api-key-controller')

const schema = Joi.object({
    id: Joi.string().required(),
    username: Joi.string().required(),
    hasPicture: Joi.boolean().required(),
})

const makeApiKey = ({ id, username, hasPicture }) => {
    const value = validate(schema, { id, username, hasPicture })
    return { api_key: encode(value), ...value }
}

module.exports = makeApiKey