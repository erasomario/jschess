const mongoose = require("mongoose");
const { Schema } = mongoose;

const colSchema = Schema({
    1: { type: Number },
    2: { type: Number },
    3: { type: Number },
    4: { type: Number },
    5: { type: Number },
    6: { type: Number },
    7: { type: Number },
    8: { type: Number }
})

const gameSchema = Schema({
    whiteId: { type: String, required: true },
    blackId: { type: String, required: true },
    startedBy: { type: String, enum: ['white', 'black'], required: true },
    createdAt: { type: Date, default: Date.now, required: true },
    current: { type: String, enum: ['white', 'black'], default: 'white', required: true },
    state: { type: String, enum: ['open', 'closed'], default: 'open', required: true },
    board: {
        whiteCaptures: [Number],
        blackCaptures: [Number],
        a: { type: colSchema },
        b: { type: colSchema },
        c: { type: colSchema },
        d: { type: colSchema },
        e: { type: colSchema },
        f: { type: colSchema },
        g: { type: colSchema },
        h: { type: colSchema }
    }
});

module.exports = mongoose.model("Game", gameSchema);