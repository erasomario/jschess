const aes = require('aes-js')

if (!process.env.AES_KEY) {
    throw Error("You should define AES_KEY as an environment var")
}

const aesKey = aes.utils.utf8.toBytes(process.env.AES_KEY)

const decodeApiKey = key => {
    if (key.substring(0, 7).toLowerCase().startsWith('bearer ')) {
        key = key.substring(7);
    }
    const aesCtr = new aes.ModeOfOperation.ctr(aesKey, new aes.Counter(5))
    return JSON.parse(aes.utils.utf8.fromBytes(aesCtr.decrypt(aes.utils.hex.toBytes(key)))).userId
}

const makeApiKey = userId => {
    const aesCtr = new aes.ModeOfOperation.ctr(aesKey, new aes.Counter(5))
    const textBytes = aes.utils.utf8.toBytes(JSON.stringify({userId, dt: new Date()}))
    return aes.utils.hex.fromBytes(aesCtr.encrypt(textBytes))
}

module.exports = {makeApiKey, decodeApiKey}