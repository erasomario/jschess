const Joi = require('joi');

var recoveryKey = Joi.object({
    key: Joi.number(),
    createdAt: Joi.date()
});

const schema = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().required().pattern(new RegExp('^[A-Za-z0-9_-]+$')),
    password: Joi.string().required(),
    createAt: Joi.date(),
    hasPicture: Joi.boolean(),
    recoveryKey: recoveryKey
})

const makeUser = (obj) => {
    const { value, error } = schema.validate(obj)
    if (error) {
        throw error
    }
    return value
}

module.exports = makeUser