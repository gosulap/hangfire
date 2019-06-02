const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    spotifyId : String,
    playlistId:String, 
    snapshotId:String
})

module.exports = mongoose.model('User', userSchema ,'Users')