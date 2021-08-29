const { decodeApiKey } = require("../application/apiKey/apiKeyInteractors")
const { findUserById } = require("../application/user/interactors/index")

const whiteList = [
    { path: new RegExp("^/api/v1/recovery_keys$"), method: "POST" },
    { path: new RegExp("^/api/v1/users$"), method: "POST" },
    { path: new RegExp("^/api/v1/api_keys$"), method: "POST" },
    { path: new RegExp("^/api/v1/translations$"), method: "POST" },
    { path: new RegExp("^/api/v1/users/.+/password/recovery$"), method: "POST" },
]

const middleware = (req, res, next) => {
    const path = req.path = req.path.replace(/\/$/, "");
    const allowed = whiteList.filter(white => {
        return white.path.test(path) && white.method == req.method
    }).length > 0;
    if (allowed) {
        next()
    } else {
        if (!req.headers['authorization']) {
            res.status(401).end()
        } else {
            findUserById(decodeApiKey(req.headers['authorization'])).then(usr => {
                req.user = usr
                next()
            }).catch(e => {
                console.log(e)
                res.status(500).end({ error: e.message })
            }
            )
        }
    }
}

module.exports = { middleware }