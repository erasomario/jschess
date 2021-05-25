const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const v1 = require("./api/v1.js");
const v2 = require("./api/v2.js");
const ApiKey = require("./model/apiKeys");

const mongooseParams = {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
    useCreateIndex: true
};

if (process.env.QOVERY_DATABASE_JSCHESS_USERNAME === undefined) {
    console.log('local');
    mongoose.connect("mongodb://localhost:27017/jschess", mongooseParams);
} else {
    console.log('remote');
    const dbUsr = process.env.QOVERY_DATABASE_JSCHESS_USERNAME;
    const dbPass = process.env.QOVERY_DATABASE_JSCHESS_PASSWORD;
    mongoose.connect(`unsafe:mongodb://${dbUsr}:${dbPass}@jschess-ezqfnngps3pgnb3n-svc.qovery.io:27017/jschess`, mongooseParams);
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    
});

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(ApiKey.middleware);
app.use(express.json());
app.use("/api/v1", v1);
app.use("/api/v2", v2);

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log(`Server Listening on ${PORT}`);
});

