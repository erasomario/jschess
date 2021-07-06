const Joi = require('joi')
const { hash, compare } = require('../../utils/Crypt')
const { validationPromise } = require('../../utils/ValidationPromise')
const makeApiKey = require('../api-key/api-key-model')
const makeUserDto = require('../user-dto/user-dto-model')
const makeUser = require('./user-model')
const userSrc = require('./user-mongoose')

const login = async (login, password) => {
    await validationPromise(Joi.object({
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

const createRecoveryPass = (login) => {
    const keyLenght = 7;
    return userSrc.findByLogin(login)
        .then(u => {
            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
            const key = ([...Array(keyLenght)]).reduce((t) => t + letters[parseInt(Math.random() * letters.length)], '')
            u.recoveryKey = { key: key, createdAt: Date.now() }
            return userSrc.editUser(u)
        }).then(sUsr => {
            const obscure = (str) => [...str].reduce((t, a, i, arr) => t + (i >= parseInt(arr.length * 0.3) && i <= parseInt(arr.length * 0.6) ? '*' : a), '')
            let parts = sUsr.email.split('@')
            return { id: sUsr.id, mail: `${obscure(parts[0])}@${obscure(parts[1])}`, keyLenght }
        })
}

const recoverPassword = (userId, recoveryKey, newPass) => {
    userSrc.findUserById(userId).then(usr => {
        if (!usr.recoveryKey) {
            throw Error('No es ha iniciado el proceso')
        }
        if (usr.recoveryKey.key !== recoveryKey) {
            throw Error('El código no coincide')
        }
        if (((new Date() - usr.recoveryKey.createdAt) / 1000 / 60) > 30) {
            throw Error('El código expiró, debe generar uno nuevo')
        }
        usr.password = hash(newPass)
        return userSrc.editUser(makeUser(user))
    })
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
    user.password = hash(newPassword)
    return userSrc.editUser(makeUser(user))
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

module.exports = {
    ...userSrc,
    login,
    createRecoveryPass,
    recoverPassword,
    editUsername,
    editPassword,
    editEmail
}