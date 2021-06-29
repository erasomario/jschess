const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server, { cors: {} })

const mongoose = require("mongoose");
const path = require("path");
const v1 = require("./api/v1.js");
const v2 = require("./api/v2.js");
const cors = require('cors')
const { connected, disconnected } = require('./model/Sockets')
const { middleware } = require('./model/authMiddleware.js')

const mongooseParams = {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
    useCreateIndex: true
};

if (process.env.APP_CONFIG) {
    console.log('remote');
    const config = JSON.parse(process.env.APP_CONFIG);
    const mongoPassword = 'kdrJ4V4WAyfevVL'
    mongoose.connect("mongodb://" + config.mongo.user + ":" + encodeURIComponent(mongoPassword) + "@" + config.mongo.hostString, mongooseParams);
} else {
    console.log('local');
    mongoose.connect("mongodb://localhost:27017/jschess", mongooseParams);
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Mongoose is working!');
});

app.use(cors())
app.use(express.static(path.join(__dirname, 'public')));
app.use(middleware);
app.use(express.json());
app.use("/api/v1", v1);
app.use("/api/v2", v2);
app.use(function (err, req, res, next) {
    if (!err) {
        console.log("Unexpected error");
        res.status(500).end()
    } else {
        console.log(err)
        res.status(500).json({ error: err })
    }
});

io.on('connection', (socket) => {
    connected(socket.handshake.query.id, socket)
    socket.on('disconnect', () => {
        disconnected(socket.handshake.query.id, socket)
    });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
