const mongoose = require("mongoose");
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
    hasPicture: { type: Boolean },
    recoveryKey: {
        key: String,
        createdAt: Date,
    },
});

const User = mongoose.model("User", userSchema);

const saveUser = (usr) => {
    const mUsr = new User(usr)
    return mUsr.save()
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
            u.hasPicture = user.hasPicture
            return u
        })
        .then(u => u.save())
        .then(su => serializeOne(su))
}

const findUserById = async (id) => {
    const result = await User.findById(id);
    return serializeOne(result);
}

const findUsersByAttr = (attr, value) => {
    const query = {}
    query[attr] = value
    return User.find(query).then(serialize);
}

const findByLogin = async (login) => {
    const u = await User.find().or([{ username: login }, { email: login }]).findOne();
    if (!u) {
        throw Error('Nombre de usuario o email incorrectos');
    }
    return serialize(u);
}

const findWithUserNameLike = (like) => {
    return new Promise((res, rej) => {
        if (like.length < 3) {
            rej(Error('Debe escribir al menos 3 letras'))
        } else {
            res(User.find({ username: new RegExp(like, "i") }))
        }
    }).then(serialize)
}

const serializeOne = ({ id, email, username, password, createdAt, hasPicture, recoveryKey }) => {
    const { key: recKey, createdAt: recCreatedAt } = recoveryKey
    const obj = { id, email, username, password, createdAt, hasPicture, recoveryKey: { key: recKey, createdAt: recCreatedAt } }
    if (!recKey) {
        delete obj.recoveryKey
    }
    return obj
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

module.exports = { 
    saveUser, 
    editUser, 
    findUserById, 
    findUsersByAttr, 
    findByLogin, 
    findWithUserNameLike
 }