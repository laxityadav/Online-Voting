const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    voted: [
        {
            _id: false,
            voteId: {
                type: Schema.Types.ObjectId,
                ref: 'Vote'
            },
            votedName: String
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);