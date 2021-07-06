const messages = {
    ES: {
        'any.required': '{{#label}} es obligatorio',
        'string.empty': '{{#label}} no debe ser vacío',
        'string.email': '{{#label}} debe ser un email válido',
        'number.base': '{{#label}} debe ser un número',
    }
};
const validationOpts = { messages, errors: { language: 'ES' } }

const validationPromise = (schema, obj) => {
    return new Promise((res, rej) => {        
        const { error } = schema.validate(obj, validationOpts)
        if (error) {
            rej(error)
        }
        res()
    })
}

module.exports = { validationPromise, validationOpts }