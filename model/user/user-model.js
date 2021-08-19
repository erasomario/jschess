const Joi = require('joi');
const { validate } = require('../../utils/Validation');

var recoveryKey = Joi.object({
    key: Joi.string(),
    createdAt: Joi.date()
});

const schema = Joi.object({
    id: Joi.string(),
    email: Joi.string().label('email').email().trim().max(254),
    username: Joi.string().label('nombre de usuario').required().alphanum().trim().max(18).min(6),
    password: Joi.string().label('contraseña').max(72).min(6),
    createdAt: Joi.date(),
    hasPicture: Joi.boolean(),
    boardOpts: Joi.string(),
    lang: Joi.string().valid("es", "en"),
    guest: Joi.boolean().required(),
    recoveryKey: recoveryKey
})

const makeUser = (obj) => {
    return validate(schema, obj)
}

module.exports = makeUser