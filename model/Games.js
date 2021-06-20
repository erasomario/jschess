const mongoose = require("mongoose");
const { Schema } = mongoose;

const gameSchema = Schema({
    whiteId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    blackId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    createdBy: { type: String, enum: ['w', 'b'], required: true },
    createdAt: { type: Date, default: Date.now, required: true },
    result: { type: String, enum: ['w', 'b', 'd'], required: false },
    turn: { type: Number, default: 0 },
    movs: [String],
    pieces: {
        wr1: { type: Map, of: String }, wn1: { type: Map, of: String }, wb1: { type: Map, of: String }, wk1: { type: Map, of: String }, wq1: { type: Map, of: String }, wb2: { type: Map, of: String }, wn2: { type: Map, of: String }, wr2: { type: Map, of: String },
        wp1: { type: Map, of: String }, wp2: { type: Map, of: String }, wp3: { type: Map, of: String }, wp4: { type: Map, of: String }, wp5: { type: Map, of: String }, wp6: { type: Map, of: String }, wp7: { type: Map, of: String }, wp8: { type: Map, of: String },
        br1: { type: Map, of: String }, bn1: { type: Map, of: String }, bb1: { type: Map, of: String }, bk1: { type: Map, of: String }, bq1: { type: Map, of: String }, bb2: { type: Map, of: String }, bn2: { type: Map, of: String }, br2: { type: Map, of: String },
        bp1: { type: Map, of: String }, bp2: { type: Map, of: String }, bp3: { type: Map, of: String }, bp4: { type: Map, of: String }, bp5: { type: Map, of: String }, bp6: { type: Map, of: String }, bp7: { type: Map, of: String }, bp8: { type: Map, of: String }
    }
});

gameSchema.statics.dto = function (dao) {
    return {
        id: dao.id,
        whitePlayerName: dao.whiteId.username,
        blackPlayerName: dao.blackId.username,
        whitePlayerId: dao.whiteId.id,
        blackPlayerId: dao.blackId.id,
        pieces: dao.pieces,
        turn: dao.turn
    };
};

module.exports = mongoose.model("Game", gameSchema)