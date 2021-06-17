const aes = require('aes-js');
const User = require("./Users");
const aesKey = aes.utils.utf8.toBytes("Yp3s6v9y$B&E)H@McQfThWmZq4t7w!z%");

const whiteList = [    
    { path: "^\/api\/v1\/recovery_keys$", method: "POST" },
    { path: "^\/api\/v1\/users$", method: "POST" },    
    { path: "^\/api\/v1\/api_keys$", method: "POST" },
    { path: "^\/api\/v1\/users\/.+\/recovered_password$", method: "PUT" },
];

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
    const path = req.path = req.path.replace(/\/$/, "");
    const allowed = whiteList.filter(white => {
        return new RegExp(white.path).test(path) && white.method == req.method;
    }).length > 0;
    if (allowed) {
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

const generateApiKey = (login, password, callback) => {
    User.findOne({ $or: [{ username: login }, { email: login }] }, (err, user) => {
        if (err) {
            callback(err, null)
        } else if (user) {
            user.checkPassword(password, function (err, isMatch) {
                if (err) {
                    callback(err, null);
                } else if (isMatch) {
                    callback(null, { api_key: encode(user), ...User.dto(user) });
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