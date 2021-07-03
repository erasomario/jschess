const express = require('express');
const { login } = require('../model/user/user-controller');
const router = express.Router();

router.post("/", function (req, res, next) {
    login(req.body.login, req.body.password)
        .then(key => res.json(key).end())
        .catch(next)
});

module.exports = router;