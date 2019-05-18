var express = require('express')
var session = require('express-session')
var passport = require('passport')
var swig = require('swig')
var SpotifyStrategy = require('passport-spotify').Strategy;
var consolidate = require('consolidate');
var SpotifyWebApi = require('spotify-web-api-node');
var request = require('request');

// used to stores sensitive stuff 
var appKey = process.env.HFID;
var appSecret = process.env.HFS;
var atoken; 
var rtoken; 
var user_id; 

var spotifyApi = new SpotifyWebApi({
  clientId: appKey,
  clientSecret: appSecret,
  // if this goes official change this up 
  redirectUri: 'http://localhost:8888/callback'
});

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete spotify profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the SpotifyStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, expires_in
//   and spotify profile), and invoke a callback with a user object.
passport.use(
  new SpotifyStrategy(
    {
      clientID: appKey,
      clientSecret: appSecret,
      callbackURL: 'http://localhost:8888/callback'
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function() {
        // To keep the example simple, the user's spotify profile is returned to
        // represent the logged-in user. In a typical application, you would want
        // to associate the spotify account with a user record in your database,
        // and return that user instead.
        
        // we need to use the accesstoken and the user id later
        atoken = accessToken
        rtoken = refreshToken
        user_id = profile.id
        return done(null, profile);
      });
    }
  )
);


// create express instance 
var app = express();

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/public'));

app.engine('html', consolidate.swig);

app.get('/', function(req, res) {
    // make a helper that will take all the playlists and call the weather api a and choose the songs accordingly 
    // pass it to the user  
    res.render('index.html', { user: req.user });
  });


// have the button redirect the user to the create page
// this is where the playlist will actually be made 
app.get('/create', function(req, res) {
    // authorize profile use for spotifyApi - dont need this if using request 
    spotifyApi.setAccessToken(atoken)
    spotifyApi.setRefreshToken(rtoken);


    // get my playlists  
    const getPlaylistOptions = {
      url: `https://api.spotify.com/v1/users/${user_id}/playlists`,
      headers: { 'Authorization': `Bearer ${atoken}` },
      json: true
    }

    const getPlaylist = {
      url: `https://api.spotify.com/v1/playlists/6i0aRaI5lKg3wfgqGvkAkw/tracks`,
      headers: { 'Authorization': `Bearer ${atoken}` },
      json: true
    }

    request.get(getPlaylistOptions, (error, response, body) => {
      request.get(getPlaylist, (error, response, body) => {
        console.log(body.items[0].track)
      });
    });
    res.render('create.html', { user: req.user });
});

// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
app.get(
  '/auth/spotify',
  passport.authenticate('spotify', {
    scope: ['user-read-email', 'user-read-private', 'playlist-read-private', 'playlist-modify-public', 'playlist-modify-private', 'playlist-read-collaborative'],
    showDialog: true
  }),
  function(req, res) {
    // The request will be redirected to spotify for authentication, so this
    // function will not be called.
  }
);

// GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  '/callback',
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  }
);

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.listen(8888, () => console.log("Listening..."));

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}
