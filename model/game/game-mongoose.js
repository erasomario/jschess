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
    lastMovAt: { type: Date, required: false },
    result: { type: String, enum: ['w', 'b', 'd'], required: false },
    movs: [movSchema],
    time: { type: Number },
    addition: { type: Number },
});

const Game = mongoose.model("Game", gameSchema);


const serializeOne = (raw) => {
    const obj = {
        id: raw.id,
        whiteId: raw.whiteId.toString(),
        blackId: raw.blackId.toString(),
        createdBy: raw.createdBy,
        createdAt: raw.createdAt,
        lastMovAt: raw.lastMovAt,
        result: raw.result,
        movs: raw.movs.map(m => {
            return {
                id: m.id,
                sCol: m.sCol,
                sRow: m.sRow,
                dCol: m.dCol,
                dRow: m.dRow,
                cast: m.cast,
                prom: m.prom,
                label: m.label,
                time: m.time
            }
        }),
        time: raw.time,
        addition: raw.addition,
    }
    return makeGame(obj)
}

const saveGame = (game) => {
    const mGame = new Game(makeGame(game))
    return mGame.save()
}

/*const editGame = (game) => {
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
}*/

const findGameById = async (id) => {
    return serializeOne(await Game.findById(id))
}

/*const findGamesByAttr = (attr, value) => {
    const query = {}
    query[attr] = value
    return Game.find(query).then(serialize);
}*/


/*const serialize = (data) => {
    if (!data) {
        return null
    }
    if (Array.isArray(data)) {
        return data.map(serializeOne)
    }
    return serializeOne(data)
}*/

module.exports = {
    saveGame,
    //editGame,
    findGameById,
    //findGamesByAttr,
    Game
}