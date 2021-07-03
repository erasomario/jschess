const express = require("express");
const Game = require("../oldmodel/Games");
const makeUserDto = require("../model/user-dto/user-dto-model");
const { addUser, findWithUserNameLike, findUserById, recoverPassword, editUser } = require("../model/user/user-controller");
const fs = require("fs")

var router = express.Router();

router.post("/", function (req, res, next) {
    addUser(req.body).then(user =>
        res.status(200).json(user)
    ).catch(next)
})

router.get("/", (req, res, next) => {
    findWithUserNameLike(req.query.like)
        .then(usrs => usrs.map(u => makeUserDto(u)))
        .then(usrs => res.status(200).json(usrs))
        .catch(next)
})

router.get("/:id", (req, res, next) => {
    findUserById(req.params.id)
        .then(usr => {
            if (!usr) {
                throw Error('No se encontró el usuario')
            }
            return res.json(makeUserDto(usr))
        }).catch(next)
});

const FILES_PATH = 'C:\\PLANOS\\'

router.get("/:id/picture", (req, res) => {
    const file = fs.readFileSync(FILES_PATH + req.params.id, 'binary')
    res.setHeader('Content-Length', file.length)
    res.write(file, 'binary')
    res.end()
})

router.put("/:id/picture", (req, res, next) => {
    const file = req.files[Object.keys(req.files)[0]]
    if (req.user.id === req.params.id) {
        findUserById(req.params.id)
            .then(user => {
                user.pictureType = file.mimetype
                return editUser(user)
            }).then(
                user => {
                    const uploadPath = FILES_PATH + user.id
                    console.log(uploadPath);
                    file.mv(uploadPath, function (err) {
                        if (err) {
                            next(err)
                        }
                        res.status(200).end()
                    })
                }
            )
    } else {
        res.status(403).end();
    }
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