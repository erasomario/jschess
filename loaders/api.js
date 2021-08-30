const express = require("express")

const api = express.Router()
api.use("/users", require("../src/user/api/userApi"))
api.use("/api_keys", require("../src/apiKey/api/apiKeysApi"))
api.use("/recovery_keys", require("../src/recoveryKey/api/recoveryKey"))
api.use("/games", require("../src/game/api/gameApi"))
api.use("/translations", require("../src/translation/api/translationApi"))

module.exports = {api}