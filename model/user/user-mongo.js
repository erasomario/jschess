const { getCollection, cleanNull } = require("../../utils/Mongo")
const { ObjectId } = require("mongodb")
const makeUser = require("./user-model")
const getUsers = () => getCollection("users")

const saveUser = async usr => {
    makeUser(usr)
    const id = await getUsers().insertOne(cleanNull(usr))
    return mongoToPlain({ _id: id.insertedId, ...usr })
}

const editUser = async user => {
    makeUser(user)
    const changes = cleanNull(user)
    getUsers().updateOne({ _id: ObjectId(user.id) }, { $set: changes })
    return user
}

const findUserById = async (id) => {
    return mongoToPlain(await getUsers().findOne({ _id: ObjectId(id) }))
}

const findUsersByAttr = async (attr, value) => {
    const query = {}
    query[attr] = value
    return mongoToPlain(await getUsers().find(query))
}

const findByLogin = async (login) => {
    const u = await getUsers().findOne({ $or: [{ username: login }, { email: login }] })
    if (!u) {
        throw Error('Nombre de usuario o email incorrectos')
    }
    return mongoToPlain(u)
}

const findWithUserNameLike = async (like) => {
    if (like.length < 3) {
        throw Error('Debe escribir al menos 3 letras');
    }
    return (await getUsers().find({ username: new RegExp(like, "i") })
        .toArray()).map(u => mongoToPlain(u))
}

const mongoToPlain = (obj) => {
    obj.id = obj._id.toString()
    delete obj._id
    delete obj.__v
    return makeUser(obj)
}

module.exports = {
    saveUser,
    editUser,
    findUserById,
    findUsersByAttr,
    findByLogin,
    findWithUserNameLike
}