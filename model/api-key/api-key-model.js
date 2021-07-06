const Joi = require('joi')
const { validationOpts } = require('../../utils/ValidationPromise')
const {encode} = require('./api-key-controller')

const schema = Joi.object({
    id: Joi.string().required(),
    username: Joi.string().required(),
    hasPicture: Joi.boolean().required(),
})

const makeApiKey = ({id, username, hasPicture}) => {
    const { value, error } = schema.validate({id, username, hasPicture}, validationOpts)
    if (error) {
        throw error
    }
    return { api_key: encode(value), ...value }
}

module.exports = makeApiKey