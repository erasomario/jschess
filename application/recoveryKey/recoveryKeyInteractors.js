const userRepo = require("./repo/userMongo")
const i18n = require("i18next")
const {sendMail} = require("../../helpers/SMTPMailSender")
const {hash} = require("../../helpers/Crypt")
const {validatePassword} = require("../user/interactors/userInteractors");

const createRecoveryPass = async (login, lang) => {
    const keyLength = 7;
    const usr = await userRepo.findByLogin(login)
    if (!usr) {
        const t = i18n.getFixedT(lang)
        throw Error(t("wrong username or email"))
    }
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    const key = ([...Array(keyLength)]).reduce(t => t + letters[Math.random() * letters.length], '')
    usr.recoveryKey = {key: key, createdAt: Date.now()}
    await userRepo.editUser(usr)
    const obscure = (str_1) => [...str_1].reduce((t_1, a, i, arr) => t_1 + (i >= parseInt(arr.length * 0.3) && i <= parseInt(arr.length * 0.6) ? '*' : a), '')
    let parts = usr.email.split('@')

    const t = i18n.getFixedT(usr.lang)
    await sendMail(usr.email, t("mario's chess account recovery instructions"), `<b>${t("username")}:</b> ${usr.username}<br/><b>${t("recovery key")}:</b> ${key}`)
    return {id: usr.id, mail: `${obscure(parts[0])}@${obscure(parts[1])}`, keyLength}
}

const recoverPassword = async (userId, recoveryKey, newPass) => {
    const user = await userRepo.findUserById(userId)
    const t = i18n.getFixedT(user.lang)
    validatePassword(newPass, t)
    if (!user.recoveryKey) {
        throw Error(t("you haven't started the account recovery yet"))
    }
    if (user.recoveryKey.key !== recoveryKey) {
        throw Error(t("recovery key doesn't match"))
    }
    if (((new Date() - user.recoveryKey.createdAt) / 1000 / 60) > 30) {
        throw Error(t("recovery key expired, you should generate a new one"))
    }
    user.password = hash(newPass)
    return userRepo.editUser(user)
}

module.exports = {createRecoveryPass, recoverPassword}