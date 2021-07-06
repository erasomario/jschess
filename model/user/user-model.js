const Joi = require('joi');
const { validationOpts } = require('../../utils/ValidationPromise');

var recoveryKey = Joi.object({
    key: Joi.string(),
    createdAt: Joi.date()
});

const schema = Joi.object({
    id: Joi.string().required(),
    email: Joi.string().email().required(),
    username: Joi.string().required().pattern(new RegExp('^[A-Za-z0-9_-]+$')),
    password: Joi.string().required(),
    createdAt: Joi.date(),
    hasPicture: Joi.boolean(),
    recoveryKey: recoveryKey
})

const makeUser = (obj) => {
    const { value, error } = schema.validate(obj, validationOpts)
    if (error) {
        throw error
    }
    return value
}

module.exports = makeUser