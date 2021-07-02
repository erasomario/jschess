const Joi = require('joi')
const { generateApiKey } = require('../../utils/apiKeys')
const { hash, compare } = require('../../utils/Crypt')
const { validationPromise } = require('../../utils/ValidationPromise')
const userSrc = require('./user-mongoose')

const login = (login, password) => {
    return validationPromise(Joi.object({
        login: Joi.string().required().label('usuario o email'),
        password: Joi.string().required().label('contraseña')
    }), { login, password })
        .then(() => userSrc.findByLogin(login))
        .then(u => {
            if (compare(password, u.password)) {
                return generateApiKey(u)
            } else {
                throw Error('Contraseña incorrecta')
            }
        })
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
        return userSrc.editUser(usr)
    })
}

module.exports = { ...userSrc, login, createRecoveryPass, recoverPassword }