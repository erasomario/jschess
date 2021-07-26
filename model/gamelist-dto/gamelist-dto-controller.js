const makeGamelistDto = require('./gamelist-dto-model')
const gameSrc = require('./gamelist-dto-mongoose')

const findGamelistDtoByStatus = async (id, status) => {
    return (await gameSrc.findGamelistDtoByStatus(id, status)).map(g => makeGamelistDto(g))
}

const findGamelistDtoById = async (id) => {
    return makeGamelistDto(await gameSrc.findGamelistDtoById(id))
}

module.exports = {
    findGamelistDtoByStatus,
    findGamelistDtoById
}