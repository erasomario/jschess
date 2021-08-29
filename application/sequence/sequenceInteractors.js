const repo = require("./repos/sequenceMongo")

module.exports = {
    getNext: repo.getNext
}