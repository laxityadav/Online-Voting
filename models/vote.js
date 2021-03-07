const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VoteSchema = new Schema({
    candidate1: String,
    desc1: String,
    voteCount1: {
        type: Number,
        default: 0
    },
    candidate2: String,
    desc2: String,
    voteCount2: {
        type: Number,
        default: 0
    },
    duration: Number,
    winner: String,
    endtime: Number,
    saveday: Number
});

module.exports = mongoose.model('Vote', VoteSchema);