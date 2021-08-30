const repo = require("../repo/index")
const sender = require("/helpers/SMTPMailSender")

module.exports = require("./userInteractors")(repo, sender)