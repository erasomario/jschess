const mongoose = require("mongoose");
const { Schema } = mongoose;

const movSchema = Schema({
    sCol: { type: Number, required: true },
    sRow: { type: Number, required: true },
    dCol: { type: Number, required: true },
    dRow: { type: Number, required: true },
    cast: { type: String, enum: ['l', 's'], required: false },
    prom: { type: String, required: false },
    label: { type: String, required: true },
    time: { type: Number },
});

const gameSchema = Schema({
    whiteId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    blackId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    createdBy: { type: String, enum: ['w', 'b'], required: true },
    createdAt: { type: Date, default: Date.now, required: true },
    lastMovAt: { type: Date, default: Date.now, required: false },
    result: { type: String, enum: ['w', 'b', 'd'], required: false },
    movs: [movSchema],
    time: {type: Number},
    addition: { type: Number },
});

gameSchema.statics.dto = function (dao) {
    return {
        id: dao.id,
        whitePlayerName: dao.whiteId.username,
        blackPlayerName: dao.blackId.username,
        whitePlayerId: dao.whiteId.id,
        blackPlayerId: dao.blackId.id,
        movs: dao.movs
    };
};

module.exports = mongoose.model("Game", gameSchema)