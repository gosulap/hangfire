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


module.exports = {
    getTracks
};