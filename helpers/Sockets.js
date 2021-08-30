const {makeGameDto} = require("../src/game/api/gameDto");
const connections = new Map()

const connected = (id, socket) => {
    if (connections.has(id)) {
        connections.set(id, [socket, ...connections.get(id)])
    } else {
        connections.set(id, [socket])
    }
}

const disconnected = (id, socket) => {
    if (connections.has(id)) {
        connections.get(id).filter(s => { s.id !== socket.id })
    }
}

const sendToList = (dest, event, payload) => {

    dest.forEach(id => {
        if (!id) {
            throw Error("Dest Id should not be null")
        }
        if (connections.has(id)) {
            connections.get(id).forEach(c => {
                c.emit(event, payload)
            });
        }
    });
}

const sendToGame = async (game, event) => {
    const dto = await makeGameDto(game)
    const dest = []
    if (game.whiteId) {
        dest.push(game.whiteId)
    }
    if (game.blackId) {
        dest.push(game.blackId)
    }
    sendToList(dest, event, dto)
    if (game.subscribers) {
        //leaving a little gap so the players are informed before the subscribers
        setTimeout(() => { 
            sendToList(game.subscribers, event, dto)
        }, 500)
    }
}

const sendToUser = (userId, event, payload) => {
    sendToList([userId], event, payload)
}

module.exports = { connected, disconnected, sendToGame, sendToUser }