const express = require("express")

const api = express.Router()
api.use("/users", require("../application/user/api/userApi"))
api.use("/api_keys", require("../application/apiKey/api/apiKeysApi"))
api.use("/recovery_keys", require("../application/recoveryKey/api/recoveryKey"))
api.use("/games", require("../application/game/api/gameApi"))
api.use("/translations", require("../application/translation/api/translationApi"))

module.exports = {api}