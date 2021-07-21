const gameSrc = require('./gamelist-dto-mongoose')

const findGamelistDtoByStatus = gameSrc.findGamelistDtoByStatus
const findGamelistDtoById = gameSrc.findGamelistDtoById

module.exports = {
    findGamelistDtoByStatus,
    findGamelistDtoById
}