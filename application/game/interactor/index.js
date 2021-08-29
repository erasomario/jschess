const gr = require("../repo/index")
const gi = require("./gameInteractors")(gr)
const cmi = require("./createMoveInteractor")(gr)
module.exports = {...gi, ...cmi}
