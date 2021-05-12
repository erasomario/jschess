const aes = require('aes-js')
const User = require("./user")

var aesKey = aes.utils.utf8.toBytes("Yp3s6v9y$B&E)H@McQfThWmZq4t7w!z%")

var decode = (key, callBack) => {
    var aesCtr = new aes.ModeOfOperation.ctr(aesKey, new aes.Counter(5))
    var sess = JSON.parse(aes.utils.utf8.fromBytes(aesCtr.decrypt(aes.utils.hex.toBytes(key))));
    User.findById(sess.id, (err, user) => {
        callBack(err, user)
    });
}

var encode = (user) => {
    var aesCtr = new aes.ModeOfOperation.ctr(aesKey, new aes.Counter(5))
    var textBytes = aes.utils.utf8.toBytes(JSON.stringify({ id: user.id, dt: new Date().getTime() }))
    return aes.utils.hex.fromBytes(aesCtr.encrypt(textBytes));
}

var middleWar = (req, res, next) => {
    if (new RegExp("^/v\\d+/public/").test(req.path)) {
        next()
    } else {
        if (!req.headers['x-api-key']) {
            res.status(401).end();
        } else {
            decode(req.headers['x-api-key'], (error, usr) => {
                if (error || !usr) {
                    res.status(500).end();
                    return;
                }
                req.user = usr
                next()
            })
        }
    }
}

var generate = (username, password, callback) => {
    User.findOne({ username: username }, (err, user) => {
        if (err) {
            callback(err, null)
        } else if (user) {
            user.checkPassword(password, function (err, isMatch) {
                if (err) {
                    callback(err, null)
                } else if (isMatch) {
                    callback(null, encode(user))
                } else {
                    callback(null, null)
                }
            });
        } else {
            callback(null, null)
        }
    })
}

module.exports = { authMiddleWar: middleWar, generate: generate }