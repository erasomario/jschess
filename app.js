const express = require('express')
const app = express()
const http = require('http')
const https = require('https')
const mongoose = require("mongoose")
const path = require("path")
const v1 = require("./api/v1.js")
const v2 = require("./api/v2.js")
const cors = require('cors')
const { connected, disconnected } = require('./utils/Sockets')
const { middleware } = require('./middleware/authMiddleware.js')
const fileUpload = require('express-fileupload')
const fs = require('fs')
require('dotenv').config()

if (!process.env.PROFILE_PICTURES_PATH) {
    throw Error("PROFILE_PICTURES_PATH should be defined")
} else {    
    if (!fs.existsSync(process.env.PROFILE_PICTURES_PATH)) {
        fs.mkdirSync(process.env.PROFILE_PICTURES_PATH, { recursive: true });
    }
}

let server
if (process.env.SSL_CONF) {
    console.log("Running on HTTPS");
    const sslConf = JSON.parse(process.env.SSL_CONF)
    const cert = fs.readFileSync(sslConf.cert)
    const ca = fs.readFileSync(sslConf.ca)
    const key = fs.readFileSync(sslConf.key)
    server = https.createServer({ cert, ca, key }, app)
    //if I'm working with HTTPS any HTTP request will be redirected to HTTPS
    const httpServer = http.createServer((req, res) => {
        res.statusCode = 301
        res.setHeader('Location', `https://${req.headers.host}${req.url}`)
        res.end()
    })
    httpServer.listen(80)
} else {
    console.log("Running on HTTP");
    server = http.createServer(app)
}

const { Server } = require("socket.io")
const io = new Server(server, { cors: {} })

const mongooseParams = {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}

if (process.env.MONGO_CONFIG) {
    console.log("Mongo with custom settings")
    const config = JSON.parse(process.env.MONGO_CONFIG)
    mongoose.connect("mongodb://" + config.user + ":" + encodeURIComponent(config.password) + "@" + config.host, mongooseParams)
} else {
    console.log("Mongo with default settings")
    mongoose.connect("mongodb://localhost:27017/jschess", mongooseParams);
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
    console.log('Mongoose is working!')
})

app.use(cors())
app.use(fileUpload())
app.use(express.static(path.join(__dirname, 'public')))

//if the request doesn't match static content and if it's not for an API we'll send the index for React Router to work
//process.env.CLIENT_SUBFOLDER allows to install the react client on a subfolder
app.use((req, res, next) => {
    const rPath = req.path = req.path.replace(/\/$/, "")
    if (rPath.match("^/api/.*")) {
        next()
    } else {
        if (process.env.CLIENT_SUBFOLDER) {
            if (rPath.match(`^/${process.env.CLIENT_SUBFOLDER}/.*`)) {
                res.sendFile(path.join(__dirname, 'public', process.env.CLIENT_SUBFOLDER, 'index.html'));
            } else {
                res.sendFile(path.join(__dirname, 'public', 'index.html'));
            }
        } else {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }
    }
})

app.use(middleware)
app.use(express.json())
app.use("/api/v1", v1)
app.use("/api/v2", v2)
app.use(function (err, req, res, next) {
    if (!err) {
        console.log("Unexpected error");
        res.status(500).end()
    } else {
        console.error(err)
        if (err instanceof Error) {
            res.status(500).json({ error: err.message })
        } else if (typeof err === 'string') {
            res.status(500).json({ error: err })
        } else {
            res.status(500)
        }
    }
    next(err)
})

io.on('connection', (socket) => {
    connected(socket.handshake.query.id, socket)
    socket.on('disconnect', () => {
        disconnected(socket.handshake.query.id, socket)
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
