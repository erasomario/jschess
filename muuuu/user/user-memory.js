const { bcryptHash } = require('../../utils/Crypt')
const makeUser = require('./user-model')

let USERS = []

const addUser = (raw, cb) => {
    const usr = makeUser(raw)
    findUsersByAttr('username', usr.username, (error, usrs) => {
        if (error) {
            throw error
        } else if (usrs.length > 0) {
            throw 'Ya existe un usuario con ese nombre'
        } else {
            findUsersByAttr('email', usr.email, (error, usrs) => {
                if (error) {
                    throw error
                } else if (usrs.length > 0) {
                    throw 'Ya existe un usuario con ese email'
                } else {
                    usr.id = USERS.length + 1
                    usr.password = bcryptHash(usr.password)
                    usr.create = new Date()
                    USERS.push(usr)
                    cb(undefined, usr)
                }
            })
        }
    })
}

const editUser = (user, cb) => {
    USERS = USERS.map(u => (u.id === user.id ? user : u))
    cb(undefined, user)
}

const findUserById = (id, cb) => {
    const arr = USERS.filter(u => u.id === id)
    if (arr.length == 0) {
        cb('No se encontró al usuario', undefined)
    } else {
        cb(undefined, arr[0])
    }
}

const findUsersByAttr = (attr, value, cb) => {
    const arr = USERS.filter(u => u[attr] === value)
    cb(undefined, arr)
}

const findByLogin = (login, cb) => {
    const arr = USERS.filter(u => u.username === login || u.email === login)
    if (arr.length === 0) {
        cb('Nombre de usuario o email incorrecto')
    } else {
        cb(undefined, arr[0])
    }
}

module.exports = { addUser, editUser, findUserById, findUsersByAttr, findByLogin }