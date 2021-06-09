const express = require("express")
const Game = require("../model/Games")
const Piece = require('../model/Piece')

var router = express.Router();

router.post("/", function (req, res) {
    const game = new Game()

    if (Math.random() <= 0.5) {
        game.whiteId = req.body.userId;
        game.blackId = req.user.id;
        game.startedBy = 'black';
    } else {
        game.whiteId = req.user.id;
        game.blackId = req.body.userId;
        game.startedBy = 'white';
    }

    const ti = Piece.toInt

    game.board = {
        whiteCaptures: [],
        blackCaptures: [],
        a: { 1: ti('wr'), 2: ti('wp'), 3: null, 4: null, 5: null, 6: null, 7: ti('bp'), 8: ti('br') },
        b: { 1: ti('wn'), 2: ti('wp'), 3: null, 4: null, 5: null, 6: null, 7: ti('bp'), 8: ti('bn') },
        c: { 1: ti('wb'), 2: ti('wp'), 3: null, 4: null, 5: null, 6: null, 7: ti('bp'), 8: ti('bb') },
        d: { 1: ti('wq'), 2: ti('wp'), 3: null, 4: null, 5: null, 6: null, 7: ti('bp'), 8: ti('bq') },
        e: { 1: ti('wk'), 2: ti('wp'), 3: null, 4: null, 5: null, 6: null, 7: ti('bp'), 8: ti('bk') },
        f: { 1: ti('wb'), 2: ti('wp'), 3: null, 4: null, 5: null, 6: null, 7: ti('bp'), 8: ti('bb') },
        g: { 1: ti('wn'), 2: ti('wp'), 3: null, 4: null, 5: null, 6: null, 7: ti('bp'), 8: ti('bn') },
        h: { 1: ti('wr'), 2: ti('wp'), 3: null, 4: null, 5: null, 6: null, 7: ti('bp'), 8: ti('br') }
    }
    game.save((error, game) => {
        if (error) {
            res.status(500).end()
        } else {
            res.status(200).json(game)
        }
    })
});

router.get("/", (req, res) => {
    if (req.query.like.trim().length < 1) {
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
                            user.save().then(() => res.status(200).end()).catch((error) => {
                                let msg = '';
                                for (const err in error.errors) {
                                    msg += (' ' + error.errors[err].message);
                                }
                                res.status(400).json({ error: msg });
                            })

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