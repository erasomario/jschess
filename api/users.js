const express = require("express");
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
    editBoardOptions,
    editLang,
} = require("../model/user/user-logic");


const fs = require("fs")
const sharp = require('sharp');
const path = require("path");
const makeApiKey = require("../model/api-key/api-key-model");
const { findNotNotifiedGamesCount, findGamesByStatus } = require("../model/game/game-logic");
const makeGamelistDto = require("../model/gamelist-dto/gamelist-dto-model");

var router = express.Router();

router.post("/", function (req, res, next) {
    addUser(req.body).then(user =>
        res.status(200).json(makeApiKey(makeUserDto(user)))
    ).catch(next)
})

router.get("/like/:like", (req, res, next) => {
    findWithUserNameLike(req.params.like)
        .then(usrs => usrs.map(u => makeUserDto(u)))
        .then(usrs => res.json(usrs))
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

router.get("/:id/picture", (req, res) => {
    const file = fs.readFileSync(path.join(process.env.PROFILE_PICTURES_PATH, req.params.id), 'binary')
    res.setHeader('Content-Length', file.length)
    res.write(file, 'binary')
    res.end()
})

router.delete("/:id/picture", async (req, res, next) => {
    if (req.user.id === req.params.id) {
        fs.unlink(path.join(process.env.PROFILE_PICTURES_PATH, req.user.id), err => {
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

router.put("/:id/picture", async (req, res, next) => {
    try {
        const file = req.files[Object.keys(req.files)[0]]
        if (req.user.id === req.params.id) {
            const user = await findUserById(req.params.id)
            user.hasPicture = true
            await editUser(user)
            await sharp(file.data)
                .resize(150, 150, { fit: 'cover' })
                .toFile(path.join(process.env.PROFILE_PICTURES_PATH, user.id))
            res.status(200).end()
        } else {
            res.status(403).end()
        }
    } catch (e) {
        next(e)
    }
})

router.put("/:id/username", (req, res, next) => {
    if (req.user.id === req.params.id) {
        editUsername(req.user.id, req.body.password, req.body.newUsername)
            .then(user => {
                res.json(makeUserDto(user))
            }).catch(next)
    } else {
        res.status(403).end();
    }
})

router.put("/:id/lang", (req, res, next) => {
    if (req.user.id === req.params.id) {
        editLang(req.user.id, req.body.lang)
            .then(user => res.json(makeUserDto(user)))
            .catch(next)
    } else {
        res.status(403).end();
    }
})


router.put("/:id/boardOptions", (req, res, next) => {
    if (req.user.id === req.params.id) {
        editBoardOptions(req.user.id, req.body)
            .then(user => res.json(makeUserDto(user)))
            .catch(next)
    } else {
        res.status(403).end();
    }
})

router.get("/:id/notNotifiedGamesCount", (req, res, next) => {
    if (req.user.id === req.params.id) {
        findNotNotifiedGamesCount(req.params.id)
            .then(c => res.json({ count: c }))
            .catch(next)
    } else {
        res.status(403).end();
    }
})

router.put("/:id/password", (req, res, next) => {
    if (req.user.id === req.params.id) {
        editPassword(req.user.id, req.body.password, req.body.newPassword)
            .then(user => res.json(makeUserDto(user)))
            .catch(next)
    } else {
        res.status(403).end();
    }
});

router.post('/:id/password/recovery', (req, res, next) => {
    recoverPassword(req.params.id, req.body.recoveryKey, req.body.password)
        .then(() => res.status(200).end())
        .catch(next)
});

router.put("/:id/email", (req, res, next) => {
    if (req.user.id === req.params.id) {
        editEmail(req.user.id, req.body.password, req.body.newEmail)
            .then(user => res.json(makeUserDto(user)))
            .catch(next)
    } else {
        res.status(403).end()
    }
})

router.get("/:id/games/:status", (req, res, next) => {
    if (req.params.id !== req.user.id) {
        res.status(403).end();
    }
    findGamesByStatus(req.params.id, req.params.status)
        .then(l => l.map(makeGamelistDto))
        .then(data => Promise.all(data))
        .then(data => res.json(data))
        .catch(next)
})

module.exports = router