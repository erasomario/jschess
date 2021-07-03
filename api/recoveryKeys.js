const express = require('express')
const { createRecoveryPass } = require('../model/user/user-controller')
const router = express.Router()

router.post('/', (req, res) => {
    const login = req.body.login
    if (!login.trim()) {
        res.status(400).json({ error: "Debe escribir un nombre de usuario o email" });
    } else {
        createRecoveryPass(login)
            .then(pass => res.status(200).json(pass))
            .catch(error => res.status(500).json({ error: error.message }))
    }
});

module.exports = router