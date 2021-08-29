const {hash, compare} = require('../../../helpers/Crypt')
const {makeUser, validatePassword, validateEmail, validateUserName} = require('../userModel')
const i18n = require('i18next')
const {getNext} = require('../../sequence/sequenceInteractors')

const createUserInteractor = function (userRepo) {

    const addGuest = async lang => {
        const usr = {}
        usr.username = i18n.getFixedT(lang)("guest") + (await getNext("guest"))
        usr.guest = true
        usr.hasPicture = false
        usr.lang = lang
        usr.createdAt = new Date()
        return await userRepo.saveUser(usr)
    }

    const addUser = async (raw, guestId) => {
        const t = i18n.getFixedT(raw.lang)
        validateEmail(raw.email, t)
        validateUserName(raw.username, t)
        validatePassword(raw.password, t)

        const lstName = await userRepo.findUsersByAttr('username', raw.username);
        if (lstName.length > 0) {
            throw Error(t("there's already a user with that name"))
        }

        const lstEmail = await userRepo.findUsersByAttr('email', raw.email)
        if (lstEmail.length > 0) {
            throw Error(t("there's already a user with that email"))
        }

        if (guestId) {
            const usr = makeUser({...(await findUserById(guestId)), ...raw})
            usr.guest = false
            usr.password = hash(usr.password)
            return (await userRepo.editUser(usr))
        } else {
            const usr = makeUser({...raw, createdAt: new Date(), guest: false})
            usr.password = hash(usr.password)
            usr.hasPicture = false
            return (await userRepo.saveUser(usr))
        }
    }

    const login = async (login, password, lang) => {
        const t = i18n.getFixedT(lang)
        if (!login) {
            throw Error(t("you should write your username or email"))
        } else if (!password) {
            throw Error(t("you should write your password"))
        }
        const u = await userRepo.findByLogin(login)
        if (!u) {
            throw Error(t("wrong username or email"))
        }
        if (compare(password, u.password)) {
            return u
        } else {
            throw Error(t("wrong password"))
        }
    }

    const editUsername = async (id, password, newUsername) => {
        const user = await userRepo.findUserById(id)
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
        const users = await userRepo.findUsersByAttr('username', newUsername)
        if (users.length > 0) {
            throw Error(t("there's already a user with that name"))
        }
        user.username = newUsername
        return userRepo.editUser(makeUser(user))
    }

    const editLang = async (id, lang) => {
        const user = await userRepo.findUserById(id)
        user.lang = lang
        return userRepo.editUser(makeUser(user))
    }

    const editBoardOptions = async (id, opts) => {
        const user = await userRepo.findUserById(id)
        user.boardOpts = JSON.stringify(opts)
        return userRepo.editUser(makeUser(user))
    }

    const editPassword = async (id, password, newPassword) => {
        const user = await userRepo.findUserById(id)
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
        return userRepo.editUser(user)
    }

    const editEmail = async (id, password, newEmail) => {
        const user = await userRepo.findUserById(id)
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
        validateEmail(newEmail, t)
        const usrs = await userRepo.findUsersByAttr('email', newEmail)
        if (usrs.length > 0) {
            throw Error(t("there's already a user with that email"))
        }
        user.email = newEmail
        return userRepo.editUser(makeUser(user))
    }

    const findUserById = id => {
        return userRepo.findUserById(id)
    }

    const editUser = usr => {
        return userRepo.editUser(usr)
    }

    const findWithUserNameLike = like => {
        return userRepo.findWithUserNameLike(like.replace(/\s/g, ""))
    }

    return {
        login,
        addUser,
        addGuest,
        editUser,
        editUsername,
        editPassword,
        editEmail,
        editLang,
        editBoardOptions,
        findUserById,
        findWithUserNameLike,
        validatePassword
    }
}

module.exports = createUserInteractor