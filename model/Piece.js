class Piece {

    static toInt(str) {
        return { wr: 1, wn: 2, wb: 3, wk: 4, wq: 5, wp: 6, br: 7, bn: 8, bb: 9, bk: 10, bq: 11, bp: 12 }[str];
    }

    static toStr(num) {
        return { 1: 'wr', 2: 'wn', 3: 'wb', 4: 'wk', 5: 'wq', 6: 'wp', 7: 'br', 8: 'bn', 9: 'bb', 10: 'bk', 11: 'bq', 12: 'bp' }[num];
    }
}

module.exports = Piece