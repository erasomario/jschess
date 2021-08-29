const nodemailer = require("nodemailer")

const sendMail = async (to, subject, html) => {
    if (process.env.SMTP_CONF) {
        const smtpConf = JSON.parse(process.env.SMTP_CONF)
        const transporter = nodemailer.createTransport({
            host: smtpConf.host,
            port: smtpConf.port,
            secure: smtpConf.secure,
            auth: {
                user: smtpConf.username,
                pass: smtpConf.password,
            }
        })

        await transporter.sendMail({
            from: smtpConf.from,
            to,
            subject,
            html
        })
    } else {
        throw Error("Mail sending is not yet configured")
    }
}

module.exports = {sendMail}