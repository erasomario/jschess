const bcrypt = require("bcrypt-nodejs");
const SALT_FACTOR = 10;

const hash = (data) => {
    const salt = bcrypt.genSaltSync(SALT_FACTOR)
    return bcrypt.hashSync(data, salt)
}

const compare = (clear, hash) => {
    return bcrypt.compareSync(clear, hash)
}

module.exports = { hash, compare }


