const gameSrc = require('./gamelist-dto-mongoose')

const findGamelistDtoByStatus = gameSrc.findGamelistDtoByStatus

module.exports = {
    findGamelistDtoByStatus
}