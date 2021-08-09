
const { getCollection, cleanNull } = require("../../utils/Mongo")
const { ObjectId } = require("mongodb")
const { makeGame } = require("./game-model")
const getGames = () => getCollection("games")

const mongoToPlain = obj => {
    obj.id = obj._id.toString()
    delete obj._id
    delete obj.__v
    obj.whiteId = obj.whiteId?.toString()
    obj.blackId = obj.blackId?.toString()
    obj.movs = obj.movs.map(m => {
        m.id = m._id?.toString()
        delete m._id
        delete m.__v
        return m
    })
    return makeGame(obj)
}

const saveGame = async game => {
    makeGame(game)
    const sGame = await getGames().insertOne(cleanNull(game))
    return mongoToPlain({ _id: sGame.insertedId, ...game })
}

const editGame = async game => {
    makeGame(game)
    const changes = cleanNull(game)
    getGames().updateOne({ _id: ObjectId(game.id) }, { $set: changes })
    return game
}

const findGameById = async id => {
    return mongoToPlain(await getGames().findOne({ _id: ObjectId(id) }))
}

const findNotNotifiedGamesCount = userId => {
    return getGames().find({
        $or: [{ whiteId: userId, createdBy: "b" }, { blackId: userId, createdBy: "w" }],
        opponentNotified: false
    }).count()
}

const findGamesByStatus = async (userId, status) => {
    const lst = await getCollection("games")
        .find({
            $or: [{ whiteId: userId }, { blackId: userId }],
            result: { $exists: status !== 'open' }
        })
        .sort({ createdAt: -1 }).toArray()
    return lst.map(mongoToPlain)
}

const findCurrentGames = async (userId) => {
    const lst = await getCollection("games")
        .find({
            whiteId: { $ne: userId },
            blackId: { $ne: userId },
            result: { $exists: false }
        })
        .sort({ createdAt: -1 })
        .limit(50).toArray()
    return lst.map(mongoToPlain)
}

module.exports = {
    saveGame,
    editGame,
    findGameById,
    findNotNotifiedGamesCount,
    findGamesByStatus,
    findCurrentGames
}