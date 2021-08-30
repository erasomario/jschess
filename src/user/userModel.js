const Joi = require('joi');
const { validate } = require('../../helpers/Validation');

const recoveryKey = Joi.object({
    key: Joi.string(),
    createdAt: Joi.date()
})

const schema = Joi.object({
    id: Joi.string(),
    email: Joi.string().label('email').email().trim().max(254),
    username: Joi.string().label('nombre de usuario').required().alphanum().trim().max(18).min(6),
    password: Joi.string().label('contraseña').max(72).min(6),
    createdAt: Joi.date().required(),
    hasPicture: Joi.boolean(),
    boardOpts: Joi.string(),
    lang: Joi.string().valid("es", "en").required(),
    guest: Joi.boolean().required(),
    recoveryKey: recoveryKey
})

const makeUser = obj => {
    return validate(schema, obj)
}

const validateEmail = (email, t) => {
    if (!email) {
        throw Error(t("you should write an email"))
    }
    const res = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (!res.test(String(email).toLowerCase())) {
        throw Error(t("'{{email}}' is no a valid email", {email}))
    }
}

const validateUserName = (username, t) => {
    if (!username) {
        throw Error(t("you should write a username"))
    }
    if (username.length < 6) {
        throw Error(t("username should be at least {{min}} characters long", {min: 6}))
    }

    if (username.length > 24) {
        throw Error(t("username should be more than {{max}} characters long", {max: 24}))
    }

    const res = /^[A-za-z0-9\-_]+$/
    if (!res.test(String(username).toLowerCase())) {
        throw Error(t("username should only contain numbers letters and hyphens"))
    }
}

const validatePassword = (pass, t) => {
    if (!pass) {
        throw Error(t("you should write a password"))
    }
    if (pass.length < 6) {
        throw Error(t("password should be at least {{min}} characters long", {min: 6}))
    }
    if (pass.length > 24) {
        throw Error(t("password should be more than {{max}} characters long", {max: 24}))
    }
    if (/^[^A-Za-z]*$/.test(pass)) {
        throw Error(t("password should contain at least one letter"))
    }
    if (/^[^0-9]*$/.test(pass)) {
        throw Error(t("password should contain at least one number"))
    }
}

module.exports = {makeUser, validateEmail, validateUserName, validatePassword}