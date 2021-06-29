const express = require('express');
const { login } = require('../muuuu/user/user-controller');
const router = express.Router();

router.post("/", function (req, res) {
    if (!req.body.login) {
        res.status(400).json({ error: "Debe escribir su nombre de usuario o email" });
    } else if (!req.body.password) {
        res.status(400).json({ error: "Debe escribir una contraseña" });
    } else {
        login(req.body.login, req.body.password)
            .then(key => res.json(key).end())
            .catch(e => res.status(500).json({ error: e.message }))
    }
});

module.exports = router;