const Joi = require('joi')
const { validate } = require('../../utils/Validation')
const { encode } = require('./api-key-logic')

const schema = Joi.object({
    id: Joi.string().required(),
    username: Joi.string().required(),
    hasPicture: Joi.boolean().required(),
    boardOpts: Joi.string(),
    lang: Joi.string()
})

const makeApiKey = user => {
    return { api_key: encode({ id: user.id }), ...validate(schema, user) }
}

module.exports = makeApiKey