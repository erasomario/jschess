const Joi = require('joi')
const { hash, compare } = require('../../utils/Crypt')
const { validate } = require('../../utils/Validation')
const makeApiKey = require('../api-key/api-key-model')
const makeUserDto = require('../user-dto/user-dto-model')
const makeUser = require('./user-model')
const userSrc = require('./user-mongoose')

const addUser = async (raw) => {
    const usr = makeUser(raw)
    const lstName = await userSrc.findUsersByAttr('username', usr.username);
    if (lstName.length > 0) {
        throw Error('Ya existe un usuario con ese nombre')
    }

    const lstEmail = await userSrc.findUsersByAttr('email', usr.email)
    if (lstEmail.length > 0) {
        throw Error('Ya existe un usuario con ese mail')
    }
    usr.password = hash(usr.password)
    usr.hasPicture = false
    const savedUsr = await userSrc.saveUser(usr)
    return savedUsr
}

const login = async (login, password) => {
    validate(Joi.object({
        login: Joi.string().required().label('usuario o email'),
        password: Joi.string().required().label('contraseña')
    }), { login, password })
    const u = await userSrc.findByLogin(login)
    if (compare(password, u.password)) {
        return makeApiKey(makeUserDto(u))
    } else {
        throw Error('Contraseña incorrecta')
    }
}

const createRecoveryPass = async (login) => {
    const keyLenght = 7;
    const u = await userSrc.findByLogin(login)
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    const key = ([...Array(keyLenght)]).reduce((t) => t + letters[parseInt(Math.random() * letters.length)], '')
    u.recoveryKey = { key: key, createdAt: Date.now() }
    const sUsr = await userSrc.editUser(u)
    const obscure = (str_1) => [...str_1].reduce((t_1, a, i, arr) => t_1 + (i >= parseInt(arr.length * 0.3) && i <= parseInt(arr.length * 0.6) ? '*' : a), '')
    let parts = sUsr.email.split('@')
    return { id: sUsr.id, mail: `${obscure(parts[0])}@${obscure(parts[1])}`, keyLenght }
}

const editUsername = async (id, password, newUsername) => {
    if (!newUsername) {
        throw Error('Debe indicar un nuevo nombre de usuario')
    } else if (!password) {
        throw Error('Debe indicar su contraseña actual')
    }
    const user = await userSrc.findUserById(id)
    if (!compare(password, user.password)) {
        throw Error('La constraseña es incorrecta')
    }
    if (user.username === newUsername) {
        throw Error('El nombre es igual al anterior')
    }
    const usrs = await userSrc.findUsersByAttr('username', newUsername)
    if (usrs.length > 0) {
        throw Error('Ya existe otro usuario con ese nombre')
    }
    user.username = newUsername
    return userSrc.editUser(makeUser(user))
}

const recoverPassword = async (userId, recoveryKey, newPass) => {
    validate(Joi.object({
        userId: Joi.string().label('id del usuario').required(),
        recoveryKey: Joi.string().label('clave de recuperación').required(),
        newPass: Joi.string().label('nueva contraseña').required()
    }), { userId, recoveryKey, newPass })

    const usr = await userSrc.findUserById(userId)
    if (!usr.recoveryKey) {
        throw Error('No es ha iniciado el proceso')
    }
    if (usr.recoveryKey.key !== recoveryKey) {
        throw Error('El código no coincide')
    }
    if (((new Date() - usr.recoveryKey.createdAt) / 1000 / 60) > 30) {
        throw Error('El código expiró, debe generar uno nuevo')
    }
    usr.password = newPass
    makeUser(usr)
    usr.password = hash(newPass)
    return userSrc.editUser(usr)
}

const editPassword = async (id, password, newPassword) => {
    if (!newPassword) {
        throw Error('Debe indicar una nueva contraseña')
    } else if (!password) {
        throw Error('Debe indicar su contraseña actual')
    }
    const user = await userSrc.findUserById(id)
    if (!compare(password, user.password)) {
        throw Error('La constraseña es incorrecta')
    }
    if (user.password === newPassword) {
        throw Error('La contraseña es igual a la anterior')
    }
    user.password = newPassword
    makeUser(user)
    user.password = hash(user.password)
    return userSrc.editUser(user)
}

const editEmail = async (id, password, newEmail) => {
    if (!newEmail) {
        throw Error('Debe indicar un nuevo email')
    } else if (!password) {
        throw Error('Debe indicar su contraseña actual')
    }
    const user = await userSrc.findUserById(id)
    if (!compare(password, user.password)) {
        throw Error('La constraseña es incorrecta')
    }
    if (user.email === newEmail) {
        throw Error('El email es igual al anterior')
    }
    const usrs = await userSrc.findUsersByAttr('email', newEmail)
    if (usrs.length > 0) {
        throw Error('Ya existe otro usuario con ese email')
    }
    user.email = newEmail
    return userSrc.editUser(makeUser(user))
}

const findUserById = (id) => {
    return userSrc.findUserById(id)
}

const editUser = (usr) => {
    return userSrc.editUser(usr)
}

const findWithUserNameLike = userSrc.findWithUserNameLike

module.exports = {
    login,
    createRecoveryPass,
    recoverPassword,
    addUser,
    editUser,
    editUsername,
    editPassword,
    editEmail,
    findUserById,
    findWithUserNameLike
}