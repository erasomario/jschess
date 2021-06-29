const bcrypt = require("bcrypt-nodejs");
const SALT_FACTOR = 10;

const hash = (data) => {
    return bcrypt.hashSync(data, SALT_FACTOR)
}

const compare = (clear, hash) => {
    return bcrypt.compareSync(clear, hash)
}

module.exports = { hash, compare }


