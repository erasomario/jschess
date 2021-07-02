const messages = {
    ES: {
        'any.required': '{{#label}} es obligatorio'
    }
};
const opts = { messages, errors: { language: 'ES' } }

const validationPromise = (schema, obj) => {
    return new Promise((res, rej) => {        
        const { error } = schema.validate(obj, opts)
        if (error) {
            rej(error)
        }
        res()
    })
}

module.exports = { validationPromise }