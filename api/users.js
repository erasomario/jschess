const express = require("express");
const User = require("../model/users");

var router = express.Router();

router.post("/", function (req, res) {
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
                        res.status(500).json({ error: "Error inesperado" });
                    } else {
                        res.status(200).json(user);
                    }
                })
            }
        });
    }
});

router.get("/", (req, res) => {
    if (req.query.like.trim().length < 3) {
        res.status(400).json({ error: "Debe escribir almenos 3 letras" });
    } else {
        User.find({ username: new RegExp(req.query.like, "i") }, (error, users) => {
            if (error) {
                res.status(500).end();
            } else {
                res.json(users.map(User.dto));
            }
        });
    }
});

router.get("/:id", (req, res) => {
    User.findById(req.params.id, (error, user) => {
        if (error) {
            res.status(500).end();
        } else if (!user) {
            res.status(400).json({ error: "No se encontró el usuario" });
        } else {
            res.json(User.dto(user));
        }
    });
});

router.put("/:id/password", (req, res) => {
    if (req.user.id === req.params.id) {
        if (req.body.password) {
            req.user.password = req.body.password;
            req.user.save().then(() => {
                res.status(200).end();
            }).catch((error) => {
                let msg = '';
                for (const err in error.errors) {
                    msg += (' ' + error.errors[err].message);
                }
                res.status(400).json({ error: msg });    
            });

        } else {
            res.status(400).json({ error: "Debe escribir una contraseña" });
        }
    } else {
        res.status(403).end();
    }
});


router.put('/:id/recovered_password', (req, res) => {
    if (!req.body.recoveryKey) {
        res.status(400).json({ error: "Debe escribir un código" });
    } if (!req.body.password) {
        res.status(400).json({ error: "Debe escribir una nueva contraseña" });
    } else {
        User.findById(req.params.id, (error, user) => {
            if (error) {
                res.status(500).end();
            } else if (!user) {
                res.status(400).json({ error: "No se encontró el usuario" });
            } else {
                if (user.recoveryKey) {
                    if (user.recoveryKey.key === req.body.recoveryKey) {
                        const m = ((new Date() - user.recoveryKey.createdAt) / 1000 / 60);
                        if (m <= 30) {
                            user.password = req.body.password;
                            user.save();
                            res.status(200).end();
                        } else {
                            res.status(400).json({ error: "El código expiró, debe generar uno nuevo" });
                        }
                    } else {
                        res.status(400).json({ error: "El código no coincide" });
                    }
                } else {
                    res.status(400).json({ error: "El código no existe" });
                }
            }
        });
    }
});

module.exports = router;