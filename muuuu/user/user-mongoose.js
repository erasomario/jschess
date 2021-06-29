const makeUser = require('./user-model')
const mongoose = require("mongoose");
const { bcryptHash } = require('../../utils/Crypt');
const { Schema } = mongoose;

const userSchema = Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: true,
        validate: {
            validator: (val) => {
                return val.length >= 6;
            },
            message: "La contraseña debe tener al menos 6 caracteres"
        }
    },
    createdAt: { type: Date, default: Date.now },
    recoveryKey: {
        key: String,
        createdAt: Date,
    },
});

const User = mongoose.model("User", userSchema);

const addUser = (raw) => {
    const usr = new User(makeUser(raw))
    return findUsersByAttr('username', usr.username)
        .then(lst => {
            if (lst.length > 0) {
                throw new Error('Ya existe un usuario con ese nombre')
            }
            return findUsersByAttr('email', usr.email)
        }).then(lst => {
            if (lst.length > 0) {
                throw new Error('Ya existe un usuario con ese mail')
            }
            usr.password = bcryptHash(usr.password)
            return usr.save()
        }).then(sUsr => serializeOne(sUsr))
}

const editUser = (user) => {
    return User.findById(user.id)
        .then(u => {
            if (!u) {
                throw Error('No se encontró el usuario')
            }
            u.email = user.email
            u.username = user.username
            u.password = user.password
            u.createdAt = user.createdAt
            u.recoveryKey = user.recoveryKey
            return u
        })
        .then(u => u.save())
        .then(su => serializeOne(su))
}

const findUserById = (id) => {
    User.findById(id).then(serializeOne)
}

const findUsersByAttr = (attr, value) => {
    const query = {}
    query[attr] = value
    return User.find(query).then(serialize);
}

const findByLogin = (login) => {
    return User.find().or([{ username: login }, { email: login }]).findOne().then(u => {
        if (!u) {
            throw Error('Nombre de usuario o email incorrectos')
        }
        return serialize(u)
    })
}

const serializeOne = ({ id, email, username, password, createdAt, recoveryKey }) => {
    const { key: recKey, createdAt: recCreatedAt } = recoveryKey
    return { id, email, username, password, createdAt, recoveryKey: { key: recKey, createdAt: recCreatedAt } }
}

const serialize = (data) => {
    if (!data) {
        return null
    }
    if (Array.isArray(data)) {
        return data.map(serializeOne)
    }
    return serializeOne(data)
}

module.exports = { addUser, editUser, findUserById, findUsersByAttr, findByLogin }