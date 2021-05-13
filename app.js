const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const token = require("./model/token");
const v1 = require("./v1.js");
const v2 = require("./v2.js");

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

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(token.middleware);
app.use(express.json());
app.use("/v1", v1);
app.use("/v2", v2);

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log(`Server Listening on ${PORT}`);
});

