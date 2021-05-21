const aes = require('aes-js')
const User = require("./user")

var aesKey = aes.utils.utf8.toBytes("Yp3s6v9y$B&E)H@McQfThWmZq4t7w!z%")

var decode = (key, callBack) => {
    if (key.substring(0, 7).toLowerCase().startsWith('bearer ')) {
        key = key.substring(7);
    }
    var aesCtr = new aes.ModeOfOperation.ctr(aesKey, new aes.Counter(5))
    var sess = JSON.parse(aes.utils.utf8.fromBytes(aesCtr.decrypt(aes.utils.hex.toBytes(key))));
    User.findById(sess.id, (err, user) => {
        callBack(err, user);
    });
}

var encode = (user) => {
    var aesCtr = new aes.ModeOfOperation.ctr(aesKey, new aes.Counter(5));
    var textBytes = aes.utils.utf8.toBytes(JSON.stringify({ id: user.id, dt: new Date().getTime() }));
    return aes.utils.hex.fromBytes(aesCtr.encrypt(textBytes));
}

var middleware = (req, res, next) => {
    if (/.*\/public\/.*/.test(req.path) || /.*\/public$/.test(req.path)) {
        next();
    } else {
        if (!req.headers['authorization']) {
            res.status(401).end();
        } else {
            decode(req.headers['authorization'], (error, usr) => {
                if (error || !usr) {
                    res.status(500).end();
                } else {
                    req.user = usr;
                    next();
                }
            });
        }
    }
}

generateApiKey = (login, password, callback) => {
    User.findOne({ $or: [{ username: login }, { email: login }] }, (err, user) => {
        if (err) {
            callback(err, null)
        } else if (user) {
            user.checkPassword(password, function (err, isMatch) {
                if (err) {
                    callback(err, null);
                } else if (isMatch) {
                    callback(null, encode(user));
                } else {
                    callback(null, null);
                }
            });
        } else {
            callback(null, null);
        }
    })
}

module.exports = { middleware, generateApiKey }