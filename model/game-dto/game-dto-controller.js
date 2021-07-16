const gameSrc = require('../game-dto/game-dto-mongoose')

const findGameDtoByStatus = gameSrc.findGameDtoByStatus

module.exports = {
    findGameDtoByStatus
}