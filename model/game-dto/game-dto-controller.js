const gameSrc = require('../game-dto/game-dto-mongoose')

const findGamesByStatus = gameSrc.findGamesByStatus

module.exports = {
    findGamesByStatus
}