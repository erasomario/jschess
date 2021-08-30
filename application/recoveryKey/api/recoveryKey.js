const express = require('express')
const { createRecoveryPass } = require('../../user/interactors/index')
const router = express.Router()

router.post('/', (req, res, next) => {
    createRecoveryPass(req.body.login, req.body.lang)
        .then(recoveryInfo => res.status(200).json(recoveryInfo))
        .catch(next)
})

module.exports = router