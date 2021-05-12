const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const apiKey = require("./model/apiKey")
const v1 = require("./v1.js")
const v2 = require("./v2.js")

mongoose.connect("unsafe:mongodb://root:7Inafu0HuiZfszff@jschess-ezqfnngps3pgnb3n-svc.qovery.io:27017/jschess", {
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
    console.log(`App started on port ${PORT}`);
});