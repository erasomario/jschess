const express = require("express");
const User = require("../model/user");

var router = express.Router();

router.post("/public", function (req, res) {
    if (!req.body.username) {
        res.status(400).json({ error: "Debe escribir un nombre de usuario" });
    } else if (!/^[A-Za-z\d\-_]+$/.test(req.body.username)) {
        res.status(400).json({ error: "El nombre de usuario debe componerse únicamente de letras, números y guiones." });
    } else if (!req.body.email) {
        res.status(400).json({ error: "Debe escribir un email" });
    } else if (!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(req.body.email)) {
        res.status(400).json({ error: "El mail no es válido." });
    } else if (!req.body.password) {
        res.status(400).json({ error: "Debe escribir un password" });
    } else if (req.body.password.trim().length < 6) {
        res.status(400).json({ error: "El password debe tener al menos 6 letras" });
    } else {
        User.findOne({ username: req.body.username }, (err, user) => {
            if (err) {
                res.status(500).json({ error: "Error inesperado" });
            } else if (user) {
                res.status(400).json({ error: "Ya éxiste un usuario con el mismo nombre" });
            } else {
                var usr = new User({
                    email: req.body.email,
                    username: req.body.username,
                    password: req.body.password,
                });
                usr.save((err, user) => {
                    if (err) {
                        console.log(err);
                        res.status(500).json({ error: "Error inesperado" });
                    } else {
                        res.status(200).json(user);
                    }
                })
            }
        });
    }
});

module.exports = router;