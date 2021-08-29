const express = require('express')
const {login, addGuest} = require('../../user/interactors/userInteractors')
const {makeApiKey} = require("../apiKeyInteractors");
const router = express.Router();

router.post("/", async function (req, res, next) {
    if (req.body.login && req.body.password) {
        login(req.body.login, req.body.password, req.body.lang)
            .then(user => res.send(makeApiKey(user.id)))
            .catch(e => setTimeout(() => next(e), 2000))
    } else {
        addGuest(req.body.lang)
            .then(user => res.send(makeApiKey(user.id)))
            .catch(next)
    }
})

module.exports = router