const express = require('express')
const router = express.Router()
const fs = require('fs')
const {promises: {readFile}} = require("fs")

router.post("/translation/", async (req, res, next) => {

    const esPath = 'C:\\Projects\\github\\jschess_react\\src\\locales\\es.json';
    const enPath = 'C:\\Projects\\github\\jschess_react\\src\\locales\\en.json'

    const esLst = JSON.parse((await readFile(esPath)))
    const enLst = JSON.parse((await readFile(enPath)))

    const key = req.body.key
    const esp = req.body.esp
    const eng = req.body.eng

    esLst[key] = esp
    enLst[key] = eng

    fs.writeFile(esPath, JSON.stringify(esLst, null, 1), a => a)
    fs.writeFile(enPath, JSON.stringify(enLst, null, 1), a => a)

    res.status(200).end()
})

module.exports = router;