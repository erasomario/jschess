const { Game } = require("../game/game-mongoose");
const makeGameDto = require("./game-dto-model");

const findGameDtoByStatus = (id, status) => {
    return Game.find()
        .or([{ whiteId: id }, { blackId: id }])
        .exists('result', status !== 'open')
        .sort({ createdAt: 'desc' })
        .populate('whiteId')
        .populate('blackId')
        .then(serialize)
}

const findGamesDtoById = (id) => {
    return Game.findById(id)
        .populate('whiteId')
        .populate('blackId')
        .then(serialize)
}


const serializeOne = (raw) => {
    return makeGameDto({
        id: raw.id,
        whiteId: raw.whiteId.id,
        blackId: raw.blackId.id,
        whiteName: raw.whiteId.username,
        blackName: raw.blackId.username,
        createdAt: raw.createdAt,
        lastMovAt: raw.lastMovAt,
        result: raw.result,
        time: raw.time,
        addition: raw.addition,
        turn: raw.movs.length
    })
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
    findGameDtoByStatus,
    findGamesDtoById
}