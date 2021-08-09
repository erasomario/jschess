const MongoClient = require('mongodb').MongoClient

const mongo = {}

if (process.env.MONGO_CONFIG) {
    console.log("Mongoose with custom settings")
    const config = JSON.parse(process.env.MONGO_CONFIG)
    MongoClient.connect("mongodb://" + config.user + ":" + encodeURIComponent(config.password) + "@" + config.host, { useUnifiedTopology: true })
} else {
    console.log("Mongoose with default settings")
    MongoClient.connect("mongodb://127.0.0.1:27017", { useUnifiedTopology: true })
    .then(client => {
        console.log('Using mongo directly')
        mongo.db = client.db('jschess')
    }).catch(error => console.error(error.message))
}

const getCollection = collection => {
    return mongo.db.collection(collection)
}

function cleanNull(orig) {
    const obj = { ...orig }
    for (let propName in obj) {
        if (obj[propName] === null || obj[propName] === undefined) {
            delete obj[propName];
        }
    }
    return obj
}

module.exports = { getCollection, cleanNull }