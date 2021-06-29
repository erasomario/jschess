const { decode } = require("./apiKeys");
const { findUserById } = require("../muuuu/user/user-controller");

const whiteList = [
    { path: "^/api/v1/recovery_keys$", method: "POST" },
    { path: "^/api/v1/users$", method: "POST" },
    { path: "^/api/v1/api_keys$", method: "POST" },
    { path: "^/api/v1/users/.+/recovered_password$", method: "PUT" },
]

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
            decode(req.headers['authorization'], (error, usrId) => {
                if (error || !usrId) {
                    res.status(500).end();
                } else {
                    findUserById(usrId, (error, usr) => {
                        req.user = usr;
                        next();
                    })
                }
            });
        }
    }
}

module.exports = { middleware }