const { hash, compare } = require('../../utils/Crypt')
const makeApiKey = require('../api-key/api-key-model')
const makeUserDto = require('../user-dto/user-dto-model')
const makeUser = require('./user-model')
const userSrc = require('./user-mongo')
const nodemailer = require('nodemailer')
const i18n = require('i18next')

const addGuest = async lang => {
    const usr = {}
    usr.username = i18n.getFixedT(lang)("guest") + ((await userSrc.findGuestCount()) + 1)
    usr.guest = true
    usr.hasPicture = false
    usr.lang = lang
    return await userSrc.saveUser(usr)
}

const validateEmail = (email, t) => {
    if (!email) {
        throw Error(t("you should write an email"))
    }
    const res = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (!res.test(String(email).toLowerCase())) {
        throw Error(t("'{{email}}' is no a valid email", { email }))
    }
}

const validateUserName = (username, t) => {
    if (!username) {
        throw Error(t("you should write a username"))
    }
    if (username.length < 6) {
        throw Error(t("username should be at least {{min}} characters long", { min: 6 }))
    }

    if (username.length > 24) {
        throw Error(t("username should be more than {{max}} characters long", { max: 24 }))
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
        throw Error(t("password should be at least {{min}} characters long", { min: 6 }))
    }
    if (pass.length > 24) {
        throw Error(t("password should be more than {{max}} characters long", { max: 24 }))
    }
    if (/^[^A-Za-z]*$/.test(pass)) {
        throw Error(t("password should contain at least one letter"))
    }
    if (/^[^0-9]*$/.test(pass)) {
        throw Error(t("password should contain at least one number"))
    }
}

const addUser = async raw => {
    const t = i18n.getFixedT(raw.lang)
    validateEmail(raw.email, t)
    validateUserName(raw.username, t)
    validatePassword(raw.password, t)
    const usr = makeUser({ ...raw, guest: false })
    const lstName = await userSrc.findUsersByAttr('username', usr.username);
    if (lstName.length > 0) {
        i18n.t()
        throw Error(t("there's already a user with that name"))
    }

    const lstEmail = await userSrc.findUsersByAttr('email', usr.email)
    if (lstEmail.length > 0) {
        throw Error(t("there's already a user with that email"))
    }
    usr.password = hash(usr.password)
    usr.hasPicture = false
    const savedUsr = await userSrc.saveUser(usr)
    return savedUsr
}

const login = async (login, password, lang) => {
    const t = i18n.getFixedT(lang)
    if (!login) {
        throw Error(t("you should write your username or email"))
    } else if (!password) {
        throw Error(t("you should write your password"))
    }
    const u = await userSrc.findByLogin(login)
    if (!u) {
        throw Error(t("wrong username or email"))
    }
    if (compare(password, u.password)) {
        return makeApiKey(makeUserDto(u))
    } else {
        throw Error(t("wrong password"))
    }
}

const createRecoveryPass = async (login, lang) => {
    const keyLenght = 7;
    const u = await userSrc.findByLogin(login)
    if (!login) {
        throw Error("you should write a username or email")
    }
    if (!u) {
        const t = i18n.getFixedT(lang)
        throw Error(t("wrong username or email"))
    }
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    const key = ([...Array(keyLenght)]).reduce((t) => t + letters[parseInt(Math.random() * letters.length)], '')
    u.recoveryKey = { key: key, createdAt: Date.now() }
    const sUsr = await userSrc.editUser(u)
    const obscure = (str_1) => [...str_1].reduce((t_1, a, i, arr) => t_1 + (i >= parseInt(arr.length * 0.3) && i <= parseInt(arr.length * 0.6) ? '*' : a), '')
    let parts = sUsr.email.split('@')

    if (process.env.SMTP_CONF) {
        const smtpConf = JSON.parse(process.env.SMTP_CONF)
        const transporter = nodemailer.createTransport({
            host: smtpConf.host,
            port: smtpConf.port,
            secure: smtpConf.secure,
            auth: {
                user: smtpConf.username,
                pass: smtpConf.password,
            }
        });

        // send email
        const t = i18n.getFixedT(u.lang)
        await transporter.sendMail({
            from: smtpConf.from,
            to: u.email,
            subject: t("mario's chess account recovery instructions"),
            html: `<b>${t("username")}:</b> ${u.username}<br/><b>${t("recovery key")}:</b> ${key}`
        })
    } else {
        throw Error("Mail sending is not yet configured")
    }

    return { id: sUsr.id, mail: `${obscure(parts[0])}@${obscure(parts[1])}`, keyLenght }
}

const editUsername = async (id, password, newUsername) => {
    const user = await userSrc.findUserById(id)
    const t = i18n.getFixedT(user.lang)
    if (!newUsername) {
        throw Error('Debe indicar un nuevo nombre de usuario')
    } else if (!password) {
        throw Error(t("you should write your password"))
    }
    if (!compare(password, user.password)) {
        throw Error(t("wrong password"))
    }
    if (user.username === newUsername) {
        throw Error(t("username hasn't changed"))
    }
    validateUserName(newUsername, t)
    const usrs = await userSrc.findUsersByAttr('username', newUsername)
    if (usrs.length > 0) {
        throw Error(t("there's already a user with that name"))
    }
    user.username = newUsername
    return userSrc.editUser(makeUser(user))
}

const editLang = async (id, lang) => {
    const user = await userSrc.findUserById(id)
    user.lang = lang
    return userSrc.editUser(makeUser(user))
}

const editBoardOptions = async (id, opts) => {
    const user = await userSrc.findUserById(id)
    user.boardOpts = JSON.stringify(opts)
    return userSrc.editUser(makeUser(user))
}

const recoverPassword = async (userId, recoveryKey, newPass) => {
    const user = await userSrc.findUserById(userId)
    const t = i18n.getFixedT(user.lang)    
    validatePassword(newPass, t)
    if (!user.recoveryKey) {
        throw Error(t("you haven't started the account recovery yet"))
    }
    if (user.recoveryKey.key !== recoveryKey) {
        throw Error(t("recovery key doesn't match"))
    }
    if (((new Date() - user.recoveryKey.createdAt) / 1000 / 60) > 30) {
        throw Error(t("recovery key expired, you should generate a new one"))
    }
    user.password = newPass
    makeUser(user)
    user.password = hash(newPass)
    return userSrc.editUser(user)
}

const editPassword = async (id, password, newPassword) => {
    const user = await userSrc.findUserById(id)
    const t = i18n.getFixedT(user.lang)
    if (!newPassword) {
        throw Error('Debe indicar una nueva contraseña')
    } else if (!password) {
        throw Error(t("you should write your password"))
    }
    if (!compare(password, user.password)) {
        throw Error(t("wrong password"))
    }
    validatePassword(password, t)
    user.password = newPassword
    makeUser(user)
    user.password = hash(user.password)
    return userSrc.editUser(user)
}

const editEmail = async (id, password, newEmail) => {
    const user = await userSrc.findUserById(id)
    const t = i18n.getFixedT(user.lang)
    if (!newEmail) {
        throw Error(t("you should write an email"))
    } else if (!password) {
        throw Error(t("you should write your password"))
    }
    if (!compare(password, user.password)) {
        throw Error(t("wrong password"))
    }
    if (user.email === newEmail) {
        throw Error(t("email hasn't changed"))
    }
    validateEmail(newEmail)
    const usrs = await userSrc.findUsersByAttr('email', newEmail)
    if (usrs.length > 0) {
        throw Error(t("there's already a user with that email"))
    }
    user.email = newEmail
    return userSrc.editUser(makeUser(user))
}

const findUserById = id => {
    return userSrc.findUserById(id)
}

const editUser = usr => {
    return userSrc.editUser(usr)
}

const findWithUserNameLike = like => {
    return userSrc.findWithUserNameLike(like.replace(/\s/g, ""))
}

module.exports = {
    login,
    createRecoveryPass,
    recoverPassword,
    addUser,
    addGuest,
    editUser,
    editUsername,
    editPassword,
    editEmail,
    editLang,
    editBoardOptions,
    findUserById,
    findWithUserNameLike
}