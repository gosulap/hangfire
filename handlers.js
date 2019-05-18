var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.HFID,
    clientSecret: process.env.HFS,
    // if this goes official change this up 
    redirectUri: 'http://localhost:8888/callback'
  });

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

function cleanTracks(playlists){
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
            seen.add(final[i].track.id)
        }
    }

    // here track_ids has unique tracks 
    // now we need to choose a random 50 
    res = getRandomTracks(track_ids)
    return res 
}

function getRandomTracks(track_ids){
    var res = []
    var seen = new Set();
    while(res.length < 50){
        random = getRandomInt(0,track_ids.length-1)
        if(seen.has(random) == false){
            // need to clean this to be in the format so that it can be added to a playlist 
            res.push("spotify:track:"+track_ids[random])
            seen.add(random)
        }
    }
    return res 
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createPlaylist(atoken,rtoken,user_id){
    spotifyApi.setAccessToken(atoken)
    spotifyApi.setRefreshToken(rtoken);

    var ps = []

    ps.push(spotifyApi.createPlaylist(user_id,'Hangfire', { 'public' : false})
    .then(function(data) {
        return data.body.id
    }, function(err) {
        console.log('Something went wrong!', err);
    }))

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

module.exports = {
    getTracks,
    cleanTracks,
    createPlaylist,
    addToPlaylist
};