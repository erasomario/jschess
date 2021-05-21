const express = require("express");
const User = require("./user");
const ApiKey = require("./apiKey");

var rt = express.Router();
rt.use("/users", User);
rt.use("/api_keys", ApiKey);
module.exports = rt;