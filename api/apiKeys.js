const express = require('express');
const makeApiKey = require('../model/api-key/api-key-model');
const { login, findUserById } = require('../model/user/user-logic');
const router = express.Router();

router.post("/", function (req, res, next) {
    login(req.body.login, req.body.password)
        .then(key => res.json(key).end())
        .catch(next)
});

router.put("/", function (req, res, next) {
    findUserById(req.user.id).then(user => {
        res.json(makeApiKey(user))        
    }).catch(next)
});

module.exports = router;