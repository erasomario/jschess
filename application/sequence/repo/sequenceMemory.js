const data = []

const getNext = async name => {
    if (data[name]) {
        data[name] = data[name] + 1
    } else {
        data[name] = 1
    }
    return data[name]
}

module.exports = {
    getNext
}