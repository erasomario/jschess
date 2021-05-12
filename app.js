const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const apiKey = require("./model/apiKey")
const v1 = require("./v1.js")
const v2 = require("./v2.js")

const dbUsr = process.env.QOVERY_DATABASE_JSCHESS_USERNAME;
const dbPass = process.env.QOVERY_DATABASE_JSCHESS_PASSWORD;

mongoose.connect(`unsafe:mongodb://${dbUsr}:${dbPass}@jschess-ezqfnngps3pgnb3n-svc.qovery.io:27017/jschess`, {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

/*mongoose.connect("mongodb://localhost:27017/jschess", {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})*/

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(apiKey.authMiddleWar);
app.use(express.json())
app.use("/v1", v1)
app.use("/v2", v2)

function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
}

const PORT = normalizePort(process.env.PORT || 3000);
console.log(`trying to listen on ${PORT}`);
app.listen(PORT, function () {
    console.log(`Listening on ${PORT}`);
})

