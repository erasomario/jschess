const i18n = require('i18next')
const en = require("../locales/en.json")
const es = require("../locales/es.json")

i18n.init({
    resources: {
        en: {translation: en},
        es: {translation: es},
    },
    debug: false,
    interpolation: {
        escapeValue: false,
    }
})
