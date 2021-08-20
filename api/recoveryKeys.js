const express = require('express')
const { createRecoveryPass } = require('../model/user/user-logic')
const router = express.Router()

router.post('/', (req, res) => {
    const login = req.body.login
    const lang = req.body.lang
    createRecoveryPass(login, lang)
        .then(pass => res.status(200).json(pass))
        .catch(error => res.status(500).json({ error: error.message }))
});

module.exports = router