const express = require('express');
const User = require('../model/users');
const router = express.Router();

router.post('/', (req, res) => {
    const login = req.body.login;
    if (!login.trim()) {
        res.status(400).json({ error: "Debe escribir un nombre de usuario o email" });
    } else {
        User.findOne({ $or: [{ username: login }, { email: login }] }, (error, user) => {
            if (error) {
                res.status(500).end();
            } else if (!user) {
                res.status(400).json({ error: "No se encontró un usuario con ese nombre o email" });
            } else {
                const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                let key = '';
                for (let i = 0; i < 7; i++) {
                    key += letters[parseInt(Math.random() * letters.length)];
                }
                user.recoveryKey = { key: key, createdAt: Date.now() };
                user.save();
                res.json({ id: user._id });
            }
        });
    }
});

module.exports = router;