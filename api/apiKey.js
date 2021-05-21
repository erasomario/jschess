const express = require('express');
const ApiKey = require('../model/apiKey');
const router = express.Router();

router.post("/public", function (req, res) {
    if (Object.keys(req.body).length === 0) {
        res.status(400).json({ error: "Empty request body" });
    } else if (!req.body.login) {
        res.status(400).json({ error: "Debe escribir su nombre de usuario o email" });
    } else if (!req.body.password) {
        res.status(400).json({ error: "Debe escribir una contraseña" });
    } else {
        ApiKey.generateApiKey(req.body.login, req.body.password, (error, key) => {
            if (error) {
                res.status(500).json({ error: "Error inesperado" });
            } else if (key) {
                res.status(200).json({ key: key });
            } else {
                res.status(400).json({ error: "Nombre de usuario o contraseña incorrectos" });
            }
        });
    }
});

module.exports = router;