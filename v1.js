const express = require("express")
const User = require("./model/user")
const apiKey = require("./model/apiKey")

var rt = express.Router()

rt.post("/public/hola/", (req, res)=>{        
    res.status(500).json({msg: 'hola '+req.body.nombre}).end();
})

rt.post("/secret", function (req, res) {
    res.status(200).send(req.user.id);
})

rt.post("/public/api_keys", function (req, res) {
    apiKey.generate(req.body.username, req.body.password, (error, key) => {
        if (error) {
            res.status(500).json({ error: "Error inesperado" })
        } else if (key) {
            res.status(200).json({ key: key })
        } else {
            res.status(400).json({ error: "Nombre de usuario o contraseña incorrectos" })
        }
    })
})

rt.post("/public/users", function (req, res) {
    User.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
            res.status(500).json({ error: "Error inesperado" })
        } else if (user) {
            res.status(400).json({ error: "Ya éxiste un usuario con el mismo nombre" })
        } else {
            var usr = new User({
                username: req.body.username,
                password: req.body.password
            });
            usr.save((err, user) => {
                if (err) {
                    res.status(500).json({ error: "Error inesperado" })
                } else {
                    res.status(200).json(user)
                }
            })
        }
    })
}
)

module.exports = rt