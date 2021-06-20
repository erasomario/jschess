const isMine = (myColor, piece) => {
    return (myColor === piece[0])
}

const simulateMov = (board, orig, dest) => {
    const newBoard = []
    Object.keys(board).forEach((square) => {
        if (square !== orig && square !== dest) {
            newBoard[square] = board[square]
        }
    })
    newBoard[dest] = { piece: board[orig].piece, movs: board[orig].movs + 1 }
    return newBoard
}

const isKingAttacked = (board, myColor) => {
    const king = `${myColor}k1`
    const attacked = getAllAttackedByEnemy(board, myColor)
    for (const square of Object.keys(board)) {
        if (board[square].piece === king) {
            const att = attacked.includes(square)
            return att
        }
    }
    return false
}

const scanTileK = (arr, board, myColor, cOrig, rOrig, cDest, rDest) => {
    if (cDest >= 1 && cDest <= 8 && rDest >= 1 && rDest <= 8) {
        const dest = `${cDest}${rDest}`;
        const orig = `${cOrig}${rOrig}`;

        //if the dest square is empty or occupied by an enemy piece, I'll check if it's safe to go that square 
        if (!board[dest] || !isMine(myColor, board[dest].piece)) {
            const newBoard = simulateMov(board, orig, dest)
            let attacked = false
            for (const square of Object.keys(newBoard)) {
                const piece = newBoard[square].piece
                if (piece[0] !== myColor) {
                    if (piece[1] !== 'k') {
                        //if it's my turn it means the enemy king is not under attack, so, there's no need to check
                        if (getAttacked(newBoard, piece[0], parseInt(square[0]), parseInt(square[1]), false).includes(dest)) {
                            attacked = true
                            break
                        }
                    } else {
                        if (getKingSquares(parseInt(square[0]), parseInt(square[1])).map(a => `${a[0]}${a[1]}`).includes(dest)) {
                            attacked = true
                            break
                        }
                    }
                }
            }
            if (!attacked) {
                arr.push(dest)
            }
        }
    }
}

const scanTileN = (arr, board, myColor, cDest, rDest) => {
    if (cDest >= 1 && cDest <= 8 && rDest >= 1 && rDest <= 8) {
        const tile = `${cDest}${rDest}`;
        if (board[tile]) {
            if (!isMine(myColor, board[tile].piece)) {
                arr.push(tile)
            }
        } else {
            arr.push(tile)
        }
    }
}

const scanRow = (arr, board, myColor, c, r, cdelta, rdelta) => {
    for (let cc = c + cdelta, rr = r + rdelta; cc >= 1 && cc <= 8 && rr >= 1 && rr <= 8; cc += cdelta, rr += rdelta) {
        const tile = `${cc}${rr}`;
        const piece = board[tile];
        if (piece) {
            if (!isMine(myColor, piece.piece)) {
                arr.push(tile)
            }
            break
        } else {
            arr.push(tile)
        }
    }
}

const getBoard = (pieces, turn) => {
    const inGameTiles = []
    const whiteCaptured = []
    const blackCaptured = []
    let lastMov
    Object.entries(pieces).forEach(p => {
        const movs = Object.keys(p[1]).map(s => parseInt(s)).sort((a, b) => a - b).filter(c => c <= turn)
        const maxTurn = movs[movs.length - 1];
        if (p[1][maxTurn] === 'c') {
            if (p[0].slice(0, 1) === 'w') {
                whiteCaptured.push(p[0])
            } else {
                blackCaptured.push(p[0])
            }
        } else {
            inGameTiles[p[1][maxTurn]] = { piece: p[0], movs: movs.length, maxTurn }
            // inGamePieces[p[0]] = { tile: p[1][maxTurn], movs: movs.length, maxTurn }
            if (maxTurn === turn && turn > 0) {
                const mov = {
                    piece: p[0],
                    orig: p[1][movs[movs.length - 2]],
                    dest: p[1][movs[movs.length - 1]]
                }

                if (!lastMov || lastMov.piece.slice(1, 2) === 'r') {
                    lastMov = mov
                }
            }
        }
    })
    return { inGameTiles, whiteCaptured: sortCaptures(whiteCaptured), blackCaptured: sortCaptures(blackCaptured), lastMov, turn }
}

const sortCaptures = (list) => {
    const conv = { p: 0, n: 1, b: 2, r: 3, q: 4 }
    return list.sort((a, b) => {
        const na = conv[a.slice(1, 2)], nb = conv[b.slice(1, 2)]
        return (na > nb ? 1 : (na < nb ? -1 : 0))
    })
}

const getKingSquares = (c, r) => {
    return [[c, r + 1], [c + 1, r + 1], [c + 1, r], [c + 1, r - 1], [c, r - 1], [c - 1, r - 1], [c - 1, r], [c - 1, r + 1]]
}

const getKnightSquares = (c, r) => {
    return [[c + 1, r + 2], [c + 2, r + 1], [c + 2, r - 1], [c + 1, r - 2], [c - 1, r - 2], [c - 2, r - 1], [c - 2, r + 1], [c - 1, r + 2]]
}

const getAllAttackedByMe = (board, myColor) => {
    let total = 0
    for (const square of Object.keys(board)) {
        if (board[square].piece.slice(0, 1) === myColor) {
            total += getAttacked(board, myColor, parseInt(square[0]), parseInt(square[1])).length;
        }
    }
    return total
}

const getAllAttackedByEnemy = (board, myColor) => {
    const enemySquares = Object.keys(board).filter(s => board[s] && board[s].piece.slice(0, 1) !== myColor)
    let attacked = []
    enemySquares.forEach(s => {
        //if it's my turn to play, it means the enemy king is not under attack, no there's no need to check
        attacked = attacked.concat(getAttacked(board, myColor === 'w' ? 'b' : 'w', parseInt(s.slice(0, 1)), parseInt(s.slice(1, 2)), false))
    })
    return attacked
}

const getCastling = (board, myColor, c, r) => {
    const attacked = getAllAttackedByEnemy(board, myColor)
    const rta = []
    if (board[`${c}${r}`] && (board[`${c}${r}`].piece.slice(1, 2) === 'k' && board[`${c}${r}`].movs === 1)) {
        if (!attacked.includes(`${c}${r}`)) {
            //long castling
            if (board[`1${r}`] && (board[`1${r}`].piece.slice(1, 2) === 'r' && board[`1${r}`].movs === 1)) {
                if (!board[`4${r}`] && !board[`3${r}`] && !board[`2${r}`]) {
                    if (!attacked.includes(`4${r}`) && !attacked.includes(`3${r}`)) {
                        rta.push(`${c - 2}${r}`)
                    }
                }
            }
            //short
            if (board[`8${r}`] && (board[`8${r}`].piece.slice(1, 2) === 'r' && board[`8${r}`].movs === 1)) {
                if (!board[`6${r}`] && !board[`7${r}`]) {
                    if (!attacked.includes(`6${r}`) && !attacked.includes(`7${r}`)) {
                        rta.push(`${c + 2}${r}`)
                    }
                }
            }
        }
    }
    return rta
}


/*list of squares attacked from the square c, r */
const getAttacked = (board, myColor, c, r, checkForKingAttacks = true) => {
    let arr = []
    const tile = `${c}${r}`
    const piece = board[tile].piece
    const type = piece.slice(1, -1)
    const color = piece.slice(0, 1)

    if (type === 'k') {
        getKingSquares(c, r).forEach(a => scanTileK(arr, board, myColor, c, r, a[0], a[1]))
    } else if (type === 'r') {
        scanRow(arr, board, myColor, c, r, 0, 1)
        scanRow(arr, board, myColor, c, r, 0, -1)
        scanRow(arr, board, myColor, c, r, 1, 0)
        scanRow(arr, board, myColor, c, r, -1, 0)
    } else if (type === 'n') {
        getKnightSquares(c, r).forEach(s => scanTileN(arr, board, myColor, s[0], s[1]))
    } else if (type === 'b') {
        scanRow(arr, board, myColor, c, r, 1, 1)
        scanRow(arr, board, myColor, c, r, 1, -1)
        scanRow(arr, board, myColor, c, r, -1, 1)
        scanRow(arr, board, myColor, c, r, -1, -1)
    } else if (type === 'q') {
        scanRow(arr, board, myColor, c, r, 1, 1)
        scanRow(arr, board, myColor, c, r, 1, -1)
        scanRow(arr, board, myColor, c, r, -1, 1)
        scanRow(arr, board, myColor, c, r, -1, -1)
        scanRow(arr, board, myColor, c, r, 0, 1)
        scanRow(arr, board, myColor, c, r, 0, -1)
        scanRow(arr, board, myColor, c, r, 1, 0)
        scanRow(arr, board, myColor, c, r, -1, 0)
    } else if (type === 'p') {
        const delta = color === 'w' ? 1 : -1
        //first square
        if (!board[`${c}${r + delta}`]) {
            arr.push(`${c}${r + delta}`)
            //second square
            if (board[tile].movs === 1 && !board[`${c}${r + delta + delta}`]) {
                arr.push(`${c}${r + delta + delta}`)
            }
        }
        //attacks
        if (board[`${c + 1}${r + delta}`]) {
            if (myColor !== board[`${c + 1}${r + delta}`].piece.slice(0, 1)) {
                arr.push(`${c + 1}${r + delta}`)
            }
        }
        if (board[`${c - 1}${r + delta}`]) {
            if (myColor !== board[`${c - 1}${r + delta}`].piece.slice(0, 1)) {
                arr.push(`${c - 1}${r + delta}`)
            }
        }
    }
    //remove every move that would left my king under attack
    if (checkForKingAttacks) {
        arr = arr.filter(s => {
            const sim = simulateMov(board, tile, s)
            return !isKingAttacked(sim, myColor)
        })
    }
    return arr
}

module.exports = { getBoard, getAttacked, getCastling, isKingAttacked }