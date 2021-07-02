const express = require("express");
const Game = require("../oldmodel/Games");
const makeUserDto = require("../muuuu/user-dto/user-dto-model");
const { addUser, recoverPassword, findUserById, findWithUserNameLike } = require("../muuuu/user/user-controller");

var router = express.Router();

router.post("/", function (req, res) {
    if (!/^[A-Za-z\d\-_]+$/.test(req.body.username)) {
        res.status(400).json({ error: "El nombre de usuario debe componerse únicamente de letras, números y guiones." });
    } if (req.body.password.trim().length < 6) {
        res.status(400).json({ error: "El password debe tener al menos 6 letras" });
    } else {
        addUser(req.body).then(user =>
            res.status(200).json(user)
        ).catch(error =>
            res.status(500).json({ error: error.message })
        )
    }
})

router.get("/", (req, res) => {
    findWithUserNameLike(req.query.like)
        .then(usrs => usrs.map(u => makeUserDto(u)))
        .then(usrs => res.status(200).json(usrs))
        //.catch(error => res.status(500).json({ error: error.message }))
});

router.get("/:id", (req, res) => {
    findUserById(req.params.id)
        .then(usr => {
            if (!usr) {
                throw Error('No se encontró el usuario')
            }
            return makeUserDto(usr)
        })
        .then(usr => res.json(usr))
        .catch(error => res.status(500).json({ error: error.message }))
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
        recoverPassword(req.params.id, req.body.recoveryKey, req.body.password)
            .then(res.status(200).end())
            .catch(error => res.status(500).end(error))
    }
});

router.get("/:id/games/:status", (req, res) => {
    if (req.params.id !== req.user.id) {
        res.status(500).end();
    }
    Game.find()
        .or([{ whiteId: req.user.id }, { blackId: req.user.id }])
        .exists('result', req.params.status !== 'open')
        .sort({ createdAt: 'desc' })
        .populate('whiteId')
        .populate('blackId')
        .exec((error, data) => {
            if (error) {
                res.status(500).json(error)
            } else {
                const m = data.map(g => {
                    let opponent
                    if (g.whiteId.id === req.user.id) {
                        opponent = g.blackId.username
                    } else {
                        opponent = g.whiteId.username
                    }
                    return { id: g.id, opponent, whiteId: g.whiteId.id, blackId: g.blackId.id, turn: g.turn }
                })
                res.status(200).json(m)
            }
        });
});

module.exports = router;