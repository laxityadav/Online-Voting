const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VoteSchema = new Schema({
    candidate1: String,
    desc1: String,
    vote_count1: Number,
    candidate2: String,
    desc2: String,
    vote_count2: Number,
    duration: Number,
    winner: String,
    is_expired: Boolean
});

module.exports = mongoose.model('Vote', VoteSchema);