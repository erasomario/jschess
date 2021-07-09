const mongoose = require("mongoose");
const makeGame = require("./game-model");
const { Schema } = mongoose;

const movSchema = Schema({
    sCol: { type: Number, required: true },
    sRow: { type: Number, required: true },
    dCol: { type: Number, required: true },
    dRow: { type: Number, required: true },
    cast: { type: String, enum: ['l', 's'], required: false },
    prom: { type: String, required: false },
    label: { type: String, required: true },
    time: { type: Number },
});

const gameSchema = Schema({
    whiteId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    blackId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    createdBy: { type: String, enum: ['w', 'b'], required: true },
    createdAt: { type: Date, default: Date.now, required: true },
    lastMovAt: { type: Date, default: Date.now, required: false },
    result: { type: String, enum: ['w', 'b', 'd'], required: false },
    movs: [movSchema],
    time: { type: Number },
    addition: { type: Number },
});

const Game = mongoose.model("Game", gameSchema);

const saveGame = (usr) => {
    const mUsr = new Game(usr)
    return mUsr.save()
}

const editGame = (game) => {
    return Game.findById(game.id)
        .then(u => {
            if (!u) {
                throw Error('No se encontró el usuario')
            }
            u.email = game.email
            u.username = game.username
            u.password = game.password
            u.createdAt = game.createdAt
            u.recoveryKey = game.recoveryKey
            u.hasPicture = game.hasPicture
            return u
        })
        .then(u => u.save())
        .then(su => serializeOne(su))
}

const findGameById = async (id) => {
    const result = await Game.findById(id);
    return serializeOne(result);
}

const findGamesByAttr = (attr, value) => {
    const query = {}
    query[attr] = value
    return Game.find(query).then(serialize);
}

const findGamesByPlayer = (id, status) => {
    return Game.find()
        .or([{ whiteId: id }, { blackId: id }])
        .exists('result', status !== 'open')
        .sort({ createdAt: 'desc' })
        .populate('whiteId')
        .populate('blackId').then(data => {
            return data.map(g => {
                let opponent
                if (g.whiteId.id === id) {
                    opponent = g.blackId.username
                } else {
                    opponent = g.whiteId.username
                }
                return { id: g.id, opponent, whiteId: g.whiteId.id, blackId: g.blackId.id, turn: g.turn }
            })
        })            
}


const serializeOne = (obj) => {
    return makeGame(obj)
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
    saveGame,
    editGame,
    findGameById,
    findGamesByAttr,
    findGamesByPlayer
}