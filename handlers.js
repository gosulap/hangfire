var SpotifyWebApi = require('spotify-web-api-node');
var mongoose = require('mongoose')
var User = require('./models/user')

// connect to the databse 
mongoose.connect('mongodb+srv://pradhitg:'+process.env.MGPWD+'@hangfire-vebds.mongodb.net/test?retryWrites=true&w=majority', {
    auth: {
      user: 'pradhitg',
      password: process.env.MGPWD
    },
    useNewUrlParser: true 
})

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.HFID,
    clientSecret: process.env.HFS,
    // if this goes official change this up 
    redirectUri: 'http://localhost:8888/callback'
  });


// save the track names in this 
var track_names = []
var final_tracks = []

// save the artist names in this
var artist_names = []
var final_artists = []


function getTracks(ids,atoken,rtoken){
    spotifyApi.setAccessToken(atoken)
    spotifyApi.setRefreshToken(rtoken);

    var track_list = []
    var ps = []
    // go through all the playlists by id 
    for(var i = 0;i<ids.length;i++){
        ps.push(spotifyApi.getPlaylist(ids[i]))
    }

    return Promise.all(ps)
    .then((results) => {
        return results; // Result of all resolve as an array
    }).catch(err => console.log(err));  // First rejected promise
}


function checkLength(id){
    spotifyApi.getPlaylist(id)
        .then(function(data) {
            return data.body.tracks.total > 100
        }, function(err) {
            console.log('Something went wrong!', err);
        });
}

// probably dont need this, this doesnt even do what i want it to 
function resolveCL(id){
    return checkLength(id) 
}

function cleanTracks(playlists,test_final,test_artist){

    // this first part puts all the track objects from all the playlists in an array 
    var final = []
    var seen = new Set();
    for(var i = 0;i<playlists.length;i++){
        for(var j = 0;j<playlists[i].items.length;j++){
            final.push(playlists[i].items[j])
        }
    }

    // at this point all the tracks are in final 
    // now need to go through and get the id's
    var track_ids = []
    for(var i = 0;i<final.length;i++){
        if(seen.has(final[i].track.id) == false)
        {
            track_ids.push(final[i].track.id)
        
            track_names.push(final[i].track.name)
           
            artist_names.push(final[i].track.artists[0].name)
        
            seen.add(final[i].track.id)
        }
    }

    // here track_ids has unique tracks 
    // now we need to choose a random 50 
    res = getRandomTracks(track_ids,test_final,test_artist)
    return res 
}

function getRandomTracks(track_ids,test_final,test_artist){
    var res = []
    var seen = new Set();
    while(res.length < 50){
        
        random = getRandomInt(0,track_ids.length-1)
        if(seen.has(random) == false){
            // this is the format needed to be able to be added to playlist 
            res.push("spotify:track:"+track_ids[random])
            
            test_final.push(track_names[random])
    
            test_artist.push(artist_names[random])
            seen.add(random)
        }
    }
    track_names = [];
    artist_names = []; 
    return res 
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createPlaylist(atoken,rtoken,user_id,in_mongo){

    spotifyApi.setAccessToken(atoken)
    spotifyApi.setRefreshToken(rtoken);


    // check if the userid is in the database, if it is remove all the tracks from that playlist and return that playlist id 
    // if the user is in the databse set in_mongo[0] == true 
    // this finishes after the if executes 


    var documents = await isUserInMongo(user_id,in_mongo)
    if(documents.length > 0){
        in_mongo[0] = true
    }

    var ps = []

    // need to have creating playlist and removing songs from playlists in helpers 
    if (in_mongo[0] == false){
        console.log("in if")
        ps.push(spotifyApi.createPlaylist(user_id,'Hangfire', { 'public' : false})
        .then(function(data) {
            // in data body there is a snapshot id need to put this in the user  
            console.log(data.body)
            return data.body.id 
        }, function(err) {
            console.log('Something went wrong!', err);
        }))
    }
    else{
        // need to get the users playlist id - this else is here so that it is easy to change this function based on if someone is in mongo or not 
        console.log("in else")
        ps.push(spotifyApi.createPlaylist(user_id,'Hangfire', { 'public' : false})
        .then(function(data) {
            console.log(data.body)
            return data.body.id
        }, function(err) {
            console.log('Something went wrong!', err);
        }))
    }


    return Promise.all(ps)
    .then((results) => {
        return results; // Result of all resolve as an array
    }).catch(err => console.log(err));  // First rejected promise

}

function addToPlaylist(track_list,playlist_id,atoken,rtoken){
    spotifyApi.setAccessToken(atoken)
    spotifyApi.setRefreshToken(rtoken);

    spotifyApi.addTracksToPlaylist(playlist_id, track_list)
    .then(function(data) {
        console.log('Added tracks to playlist!');
    }, function(err) {
        console.log('Something went wrong!', err);
    });
    
}

function isUserInMongo(user_id,in_mongo){
    return User.find({ spotifyId: user_id }).exec()
}

// if the user has used hangfire theyll have  a playlist id 
// if that exists then remove all the tracks from that playlist and call add to playlist with that id 

module.exports = {
    getTracks,
    cleanTracks,
    createPlaylist,
    addToPlaylist, 
    final_tracks,
    final_artists
};