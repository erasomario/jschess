const { decode } = require("../model/api-key/api-key-controller");
const { findUserById } = require("../model/user/user-controller");

const whiteList = [
    { path: new RegExp("^/api/v1/recovery_keys$"), method: "POST" },
    { path: new RegExp("^/api/v1/users$"), method: "POST" },
    { path: new RegExp("^/api/v1/api_keys$"), method: "POST" },
    { path: new RegExp("^/api/v1/users/.+/password/recovery$"), method: "POST" },
]

var middleware = (req, res, next) => {
    const path = req.path = req.path.replace(/\/$/, "");
    const allowed = whiteList.filter(white => {
        return white.path.test(path) && white.method == req.method;
    }).length > 0;
    if (allowed) {
        next();
    } else {
        if (!req.headers['authorization']) {
            res.status(401).end();
        } else {
            const sess = decode(req.headers['authorization'])
            findUserById(sess.id).then(usr => {
                req.user = usr
                next()
            }).catch(e =>
                res.status(500).end({ error: e.message })
            );
        }
    }
}

module.exports = { middleware }