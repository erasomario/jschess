const express = require("express");
const Game = require("../oldmodel/Games");
const makeUserDto = require("../model/user-dto/user-dto-model");
const {
    addUser,
    findWithUserNameLike,
    findUserById,
    recoverPassword,
    editUser,
    editUsername,
    editPassword, 
    editEmail,
} = require("../model/user/user-controller");
const fs = require("fs")
const sharp = require('sharp');
const path = require("path");

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

router.delete("/:id/picture", (req, res, next) => {
    if (req.user.id === req.params.id) {
        fs.unlink(path.join(FILES_PATH, req.user.id), err => {
            if (err) {
                next(err)
            } else {
                findUserById(req.params.id)
                    .then(user => {
                        user.hasPicture = false
                        return editUser(user)
                    }).then((user) => {
                        res.json(user)
                    }).catch(err => next(err))
            }
        })
    } else {
        res.status(403).end();
    }
})

router.put("/:id/picture", (req, res, next) => {
    const file = req.files[Object.keys(req.files)[0]]
    if (req.user.id === req.params.id) {
        findUserById(req.params.id)
            .then(user => {
                user.hasPicture = true
                return editUser(user)
            }).then(
                user => {
                    const uploadPath = FILES_PATH + user.id
                    return sharp(file.data)
                        .resize(150, 150, { fit: 'cover' })
                        .toFile(uploadPath)

                }
            ).then(() => {
                res.status(200).end()
            }
            ).catch(next)
    } else {
        res.status(403).end();
    }
});

router.put("/:id/username", (req, res, next) => {
    if (req.user.id === req.params.id) {
        editUsername(req.user.id, req.body.password, req.body.newUsername).then(user => {
            res.json(makeUserDto(user))
        }).catch(next)
    } else {
        res.status(403).end();
    }
})

router.put("/:id/password", (req, res, next) => {
    if (req.user.id === req.params.id) {
        editPassword(req.user.id, req.body.password, req.body.newPassword).then(user => {
            res.json(makeUserDto(user))
        }).catch(next)
    } else {
        res.status(403).end();
    }
});

router.put("/:id/email", (req, res, next) => {
    if (req.user.id === req.params.id) {
        editEmail(req.user.id, req.body.password, req.body.newEmail).then(user => {
            res.json(makeUserDto(user))
        }).catch(next)
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