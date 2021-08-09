const mongoose = require("mongoose");
const { makeGame } = require("./game-model");
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
    whiteId: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    blackId: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    createdBy: { type: String, enum: ['w', 'b'], required: true },
    createdAt: { type: Date, default: Date.now, required: true },
    lastMovAt: { type: Date, required: false },
    result: { type: String, enum: ['w', 'b', 'd'], required: false },
    endType: { type: String, enum: ['time', 'check', 'stale', 'material', 'agreed', 'surrender'], required: false },
    movs: [movSchema],
    time: { type: Number },
    addition: { type: Number },
    requestedColor: { type: String, enum: ['w', 'wb', 'd'], required: true },
    opponentNotified: { type: Boolean, default: false, required: true },
    drawOfferedBy: { type: String, enum: ['w', 'b'] }
});

const Game = mongoose.model("Game", gameSchema);

const plainToMongoose = (mongo, plain) => {
    mongo.id = plain.id
    mongo.whiteId = plain.whiteId
    mongo.blackId = plain.blackId
    mongo.createdBy = plain.createdBy
    mongo.createdAt = plain.createdAt
    mongo.lastMovAt = plain.lastMovAt
    mongo.result = plain.result
    mongo.endType = plain.endType
    mongo.requestedColor = plain.requestedColor
    mongo.opponentNotified = plain.opponentNotified
    mongo.drawOfferedBy = plain.drawOfferedBy
    //as movs is an only add collection and items are added one at time
    //it's safe to asume that if sizes doesn't match, it's due to the last item is missing
    if (mongo.movs.length !== plain.movs.length) {
        const m = plain.movs[plain.movs.length - 1]
        mongo.movs.push({
            id: m.id,
            sCol: m.sCol,
            sRow: m.sRow,
            dCol: m.dCol,
            dRow: m.dRow,
            cast: m.cast,
            prom: m.prom,
            label: m.label,
            time: m.time
        })
    }
    mongo.time = plain.time
    mongo.addition = plain.addition
}

const mongooseToPlain = (obj) => {
    obj.id = obj._id.toString()
    delete obj._id
    delete obj.__v
    obj.whiteId = obj.whiteId?.toString()
    obj.blackId = obj.blackId?.toString()
    obj.movs = obj.movs.map(m => {
        m.id = m._id.toString()
        delete m._id
        delete m.__v
        return m
    })
    return makeGame(obj)
}

const saveGame = async (game) => {
    const ng = new Game()
    plainToMongoose(ng, game)
    return mongooseToPlain(await ng.save().toObject())
}

const editGame = async (game) => {
    const mGame = await Game.findById(game.id)
    plainToMongoose(mGame, game)
    return mongooseToPlain(await mGame.save().toObject())
}

const findGameById = async (id) => {
    const mong = await Game.findById(id).lean()
    const plain = mongooseToPlain(mong)
    return plain
}

const findNotNotifiedGamesCount = (userId) => {
    return Game.find()
        .or([{ whiteId: userId, createdBy: "b" }, { blackId: userId, createdBy: "w" }])
        .and({ opponentNotified: false })
        .countDocuments()
}

const findGamesByStatus = (id, status) => {
    return Game.find()
        .or([{ whiteId: id }, { blackId: id }])
        .exists('result', status !== 'open')
        .sort({ createdAt: 'desc' })
        .populate('whiteId')
        .populate('blackId')
        .then(l => l.map(mongooseToPlain))
}

module.exports = {
    saveGame,
    editGame,
    findGameById,
    findNotNotifiedGamesCount,
    findGamesByStatus,
    Game
}