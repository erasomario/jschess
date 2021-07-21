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
    endType: { type: String, enum: ['time'], required: false },
    movs: [movSchema],
    time: { type: Number },
    addition: { type: Number },
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
    mongo.movs = plain.movs.map(m => {
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
    })
    mongo.time = plain.time
    mongo.addition = plain.addition
}

const mongooseToPlain = (raw) => {
    const obj = {
        id: raw.id,
        whiteId: raw.whiteId?.toString(),
        blackId: raw.blackId?.toString(),
        createdBy: raw.createdBy,
        createdAt: raw.createdAt,
        lastMovAt: raw.lastMovAt,
        result: raw.result,
        endType: raw.endType,
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

const saveGame = async (game) => {
    const ng = new Game()
    plainToMongoose(ng, game)
    return mongooseToPlain(await ng.save())
}

const editGame = async (game) => {
    const mGame = await Game.findById(game.id)
    plainToMongoose(mGame, game)
    return mongooseToPlain(await mGame.save())
}

const findGameById = async (id) => {
    return mongooseToPlain(await Game.findById(id))
}

module.exports = {
    saveGame,
    editGame,
    findGameById,
    Game
}