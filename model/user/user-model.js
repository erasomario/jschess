const Joi = require('joi');

var recoveryKey = Joi.object({
    key: Joi.number(),
    createdAt: Joi.date()
});

const schema = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    createAt: Joi.date(),
    recoveryKey: recoveryKey
})

const makeUser = (obj) => {
    const { value, error } = schema.validate(obj)
    if (error) {
        throw error.details[0].message
    }
    return value
}

module.exports = makeUser