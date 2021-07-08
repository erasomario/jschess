const messages = {
    ES: {
        'any.required': '{{#label}} es obligatorio',
        'string.empty': '{{#label}} no debe ser vacío',
        'string.email': '{{#label}} debe ser un email válido',
        'number.base': '{{#label}} debe ser un número',
        'string.alphanum': '{{#label}} solo debe tener números y letras',
        'string.min': '{{#label}} debe tener al menos {{#limit}} caracteres',
        'string.max': '{{#label}} no debe tener más de  {{#limit}} caracteres',
    }
};
const validationOpts = { messages, errors: { language: 'ES' } }

const validate = (schema, obj) => {
    const { error, value } = schema.validate(obj, validationOpts)
    if (error) {
        throw Error(error.message)
    }
    return value
}

module.exports = { validate }