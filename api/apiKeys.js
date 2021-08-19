const express = require('express');
const makeApiKey = require('../model/api-key/api-key-model');
const { login, findUserById, addGuest } = require('../model/user/user-logic');
const router = express.Router();
const makeUserDto = require('../model/user-dto/user-dto-model');

router.post("/", async function (req, res, next) {
    if (req.body.login && req.body.password) {
        login(req.body.login, req.body.password)
            .then(key => res.json(key).end())
            .catch(next)
    } else {
        try {
            const guest = await addGuest(req.body.lang)
            const key = await makeApiKey(makeUserDto(guest))
            res.json(key)
        } catch (e) {
            next(e)
        }
    }
});

router.put("/", function (req, res, next) {
    findUserById(req?.user?.id).then(user => {
        res.json(makeApiKey(user))
    }).catch(next)
});

module.exports = router;