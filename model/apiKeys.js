const aes = require('aes-js');
const aesKey = aes.utils.utf8.toBytes("Yp3s6v9y$B&E)H@McQfThWmZq4t7w!z%");


var decode = (key, callBack) => {
    if (key.substring(0, 7).toLowerCase().startsWith('bearer ')) {
        key = key.substring(7);
    }
    var aesCtr = new aes.ModeOfOperation.ctr(aesKey, new aes.Counter(5))
    var sess = JSON.parse(aes.utils.utf8.fromBytes(aesCtr.decrypt(aes.utils.hex.toBytes(key))));
    callBack(undefined, sess.id);
}

var encode = (user) => {
    var aesCtr = new aes.ModeOfOperation.ctr(aesKey, new aes.Counter(5));
    var textBytes = aes.utils.utf8.toBytes(JSON.stringify({ id: user.id, dt: new Date().getTime() }));
    return aes.utils.hex.fromBytes(aesCtr.encrypt(textBytes));
}

const generateApiKey = (user) => {
    const rta = { api_key: encode(user), ...user }
    delete rta.password
    delete rta.recoveryKey
    return rta;
}

module.exports = { generateApiKey, decode }