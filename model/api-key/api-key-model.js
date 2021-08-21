const makeUserDto = require('../user-dto/user-dto-model')
const { encode } = require('./api-key-logic')

const makeApiKey = user => {    
    return { api_key: encode({ id: user.id }), ...makeUserDto(user) }
}

module.exports = makeApiKey