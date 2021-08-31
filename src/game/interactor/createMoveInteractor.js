const i18n = require("i18next")
const {findUserById} = require("../../user/interactors/index")
const {
    getBoard,
    includes,
    getCastling,
    getAttacked,
    isKingAttacked,
    getAllAttackedByMe,
    getBoardHash,
    checkEnoughMaterial
} = require("../../../helpers/Chess");
const {sendToGame} = require("../../../helpers/Sockets")
const {generateBotMove} = require("../../bot/botInteractor")

const makeCreateMoveInteractor = (gameRepo) => {

    const createMove = async (game, playerId, src, dest, piece, prom) => {
        const t = i18n.getFixedT(playerId ? (await findUserById(playerId)).lang : "en")

        if (game.result) {
            throw Error(t("game is over"))
        }
        const myColor = playerId === game.whiteId ? "w" : "b"
        const myTurn = myColor === "w" ? game.movs.length % 2 === 0 : game.movs.length % 2 !== 0

        if (!myTurn) {
            throw Error(t("it's not your turn to move"))
        }

        const board = getBoard(game.movs, game.movs.length)
        const touched = board.touched
        const tiles = board.inGameTiles

        if (!tiles[src[1]][src[0]]) {
            throw Error(t("source square is empty"))
        }
        if (piece) {
            if (tiles[src[1]][src[0]] !== piece) {
                throw Error(t("piece is not at the designated origin square"))
            }
        } else {
            piece = tiles[src[1]][src[0]]
        }
        if (piece.slice(0, 1) !== myColor) {
            throw Error(t("you're trying to move a piece that's not yours"))
        }

        if (includes(getCastling(tiles, touched, myColor, src[0], src[1]), dest[0], dest[1])) {
            game.movs.push({sCol: src[0], sRow: src[1], dCol: dest[0], dRow: dest[1], cast: dest[0] === 6 ? "s" : "l"})
        } else if ((piece[1] === "p") && ((piece[0] === "w" && src[1] === 6) || (piece[0] === "b" && src[1] === 1))) {
            if (!prom) {
                prom = "q"
            }
            const attacked = getAttacked(tiles, touched, myColor, src[0], src[1])
            if (!includes(attacked, dest[0], dest[1])) {
                throw Error(t("you can't move the piece to that square"))
            }
            let pieces = 0
            tiles.forEach(row => row.forEach(p => {
                if (p && (p.slice(0, 1) === myColor && p.slice(1, 2) === prom)) {
                    pieces++
                }
            }))
            game.movs.push({
                sCol: src[0],
                sRow: src[1],
                dCol: dest[0],
                dRow: dest[1],
                prom: `${myColor}${prom}${pieces + 1}`
            })
        } else {
            const attacked = getAttacked(tiles, touched, myColor, src[0], src[1])
            if (!includes(attacked, dest[0], dest[1])) {
                throw Error(t("you can't move the piece to that square"))
            }
            game.movs.push({sCol: src[0], sRow: src[1], dCol: dest[0], dRow: dest[1]})
        }

        const newBoard = getBoard(game.movs, game.movs.length)
        const newTouched = newBoard.touched
        const newTiles = newBoard.inGameTiles

        const kingAttacked = isKingAttacked(newTiles, newTouched, myColor === "w" ? "b" : "w")
        const possibleMoves = getAllAttackedByMe(newTiles, newTouched, myColor === "w" ? "b" : "w").length

        if (!kingAttacked && possibleMoves === 0) {
            game.result = "d"
            game.endType = "stale"
        } else if (kingAttacked && possibleMoves === 0) {
            game.result = myColor
            game.endType = "check"
        }

        setLabel(game.movs[game.movs.length - 1], tiles, kingAttacked, possibleMoves)

        if (game.movs.length > 2) {
            game.movs[game.movs.length - 1].time = (Date.now() - game.lastMovAt.getTime()) / 1000
        }

        if (game.movs.length >= 2) {
            game.lastMovAt = new Date()
        }

        const hash = getBoardHash(newBoard)
        game.movs[game.movs.length - 1].boardHash = hash

        let reps = 0
        game.movs.forEach((m, i) => {
            if (i < game.movs.length - 2 && m.boardHash === hash) {
                reps++
            }
        })
        //it's 2 cos I need to find another to hashes like mine to make it 3
        if (reps === 2) {
            game.result = "d"
            game.endType = "threefold"
        }

        if (!game.result && game.time) {
            const times = getElapsedTimes(game)
            if (times.wSecs <= 0) {
                game.result = "b"
                game.endType = "time"
            } else if (times.bSecs <= 0) {
                game.result = "w"
                game.endType = "time"
            }
        }

        if (!game.result) {
            if (!checkEnoughMaterial(newTiles)) {
                game.result = "w"
                game.endType = "material"
            }
        }

        await gameRepo.editGame(game)
        if ((game.movs.length % 2 === 0 && !game.whiteId) || (game.movs.length % 2 !== 0 && !game.blackId)) {
            setTimeout(async () => {
                try {
                    await botMove(game)
                } catch (e) {
                    console.log(e)
                }
            }, 1500)
        }
        await sendToGame(game, "gameChanged")
        return null
    }

    const setLabel = (mov, board, kingAttacked, possibleMoves) => {
        const piece = board[mov.sRow][mov.sCol]
        const letters = ["a", "b", "c", "d", "e", "f", "g", "h"]
        const getTileName = (c, r) => `${letters[c]}${r + 1}`
        const capture = board[mov.dRow][mov.dCol]
        const suf = kingAttacked ? (possibleMoves > 0 ? "+" : "#") : ""
        if (mov.cast) {
            mov.label = (mov.cast === "s" ? "0-0" : "0-0-0") + suf
        } else {
            if (piece.slice(1, 2) === "p") {
                const prom = mov.prom ? `${mov.prom[1].toUpperCase()}` : ""
                if (capture) {
                    mov.label = `${letters[mov.sCol]}x${getTileName(mov.dCol, mov.dRow)}${prom.slice(1, 2).toUpperCase()}${suf}`
                } else {
                    mov.label = `${getTileName(mov.dCol, mov.dRow)}${prom}${suf}`
                }
            } else {
                mov.label = `${piece.slice(1, 2).toUpperCase()}${capture ? "x" : ""}${getTileName(mov.dCol, mov.dRow)}${suf}`
            }
        }
    }

    const botMove = async game => {
        const m = await generateBotMove(game)
        if (m) {
            await createMove(game, m.userId, m.src, m.dest)
        }
    }

    const getElapsedTimes = game => {
        const rta = {
            wSecs: game.time * 60,
            bSecs: game.time * 60
        }

        if (game.movs.length >= 2) {
            for (let i = 0; i < game.movs.length; i++) {
                if (i % 2 === 0) {
                    if (game.movs[i].time) {
                        rta.wSecs -= game.movs[i].time
                        rta.wSecs += game.addition
                    }
                } else {
                    if (game.movs[i].time) {
                        rta.bSecs -= game.movs[i].time
                        rta.bSecs += game.addition
                    }
                }
            }

            if (game.movs.length % 2 === 0) {
                rta.wSecs -= (Date.now() - game.lastMovAt.getTime()) / 1000
            } else {
                rta.bSecs -= (Date.now() - game.lastMovAt.getTime()) / 1000
            }
        }
        return rta
    }

    const timeout = async id => {
        const game = await gameRepo.findGameById(id)
        if (!game.result && game.time) {
            const times = getElapsedTimes(game)
            if (times.wSecs <= 0) {
                game.result = "b"
            } else if (times.bSecs <= 0) {
                game.result = "w"
            }
            if (game.result) {
                game.endType = "time"
                await gameRepo.editGame(game)
                await sendToGame(game, 'gameChanged')
            }
        }
    }

    return {createMove, timeout, botMove}
}

module.exports = makeCreateMoveInteractor