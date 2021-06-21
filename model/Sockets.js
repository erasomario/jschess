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

const send = (ids, event, payload) => {
    ids.forEach(id => {
        if (connections.has(id)) {
            connections.get(id).forEach(c => {
                c.emit(event, payload)
            });
        }
    });
}

module.exports = { connected, disconnected, send }