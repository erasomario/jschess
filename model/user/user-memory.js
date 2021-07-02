const { bcryptHash } = require('../../utils/Crypt')
const makeUser = require('./user-model')

let USERS = []

const addUser = (raw) => {
    const usr = makeUser(raw)
    findUsersByAttr('username', usr.username)
        .then(lst => {
            if (lst.length > 0) {
                throw 'Ya existe un usuario con ese nombre'
            }
            return findUsersByAttr('email', usr.email)
        }).then(lst => {
            if (lst.length > 0) {
                throw 'Ya existe un usuario con ese email'
            }
            usr.id = USERS.length + 1
            usr.password = bcryptHash(usr.password)
            usr.create = new Date()
            USERS.push(usr)
            return usr
        })
}

const editUser = (user) => {
    return new Promise((res) => {
        USERS = USERS.map(u => (u.id === user.id ? user : u))
        res(user)
    })
}

const findUserById = (id) => {
    return new Promise((res, rej) => {
        const arr = USERS.filter(u => u.id === id)
        if (arr.length == 0) {
            rej(Error('No se encontró al usuario'))
        } else {
            res(arr[0])
        }
    })
}

const findUsersByAttr = (attr, value) => {
    return new Promise((res) => {
        res(USERS.filter(u => u[attr] === value))
    })
}

const findByLogin = (login) => {
    return new Promise((res, rej) => {
        const arr = USERS.filter(u => u.username === login || u.email === login)
        if (arr.length === 0) {
            rej(Error('Nombre de usuario o email incorrecto'))
        } else {
            res(arr[0])
        }
    })
}

module.exports = { addUser, editUser, findUserById, findUsersByAttr, findByLogin }