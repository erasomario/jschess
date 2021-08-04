const Joi = require('joi')
const { validate } = require('../../utils/Validation')
const { encode } = require('./api-key-controller')

const schema = Joi.object({
    id: Joi.string().required(),
    username: Joi.string().required(),
    hasPicture: Joi.boolean().required(),
    boardOpts: Joi.string()
})

const makeApiKey = ({ id, username, hasPicture, boardOpts }) => {
    const value = validate(schema, { id, username, hasPicture, boardOpts })
    return { api_key: encode(value), ...value }
}

module.exports = makeApiKey