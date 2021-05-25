const express = require("express");

var rt = express.Router();
rt.use("/users", require("./users"));
rt.use("/api_keys", require("./apiKeys"));
rt.use("/recovery_keys", require("./recoveryKeys"));
module.exports = rt;