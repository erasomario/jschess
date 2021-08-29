const repo = require("../repo/sequenceMongo")

const getNext = name => {
    return repo.getNext(name)
}

module.exports = {
    getNext
}