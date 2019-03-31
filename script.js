const urlParams = new URLSearchParams(window.location.search);
let song = "";
let bname = "";

if(urlParams.has('song')) {
  song = urlParams.get('song');
}

if(urlParams.has('name')) {
  bname = urlParams.get('name');
}

// Get the hash of the url
const hash = window.location.hash
.substring(1)
.split('&')
.reduce(function (initial, item) {
  if (item) {
    var parts = item.split('=');
    initial[parts[0]] = decodeURIComponent(parts[1]);
  }
  return initial;
}, {});

const state = hash.state;
window.location.hash = '';

// Set token
let _token = hash.access_token;

const authEndpoint = 'https://accounts.spotify.com/authorize';

// Replace with your app's client ID, redirect URI and desired scopes
const clientId = 'a81c48f2f86d42aa95e34a1280330c35';
const redirectUri = 'https://happy-birthday-singer.glitch.me';
const scopes = [
  'streaming',
  'user-read-birthdate',
  'user-read-private',
  'user-modify-playback-state',
];

// If there is no token, redirect to Spotify authorization
if (!_token) {
  let state_string = "";
  
  if(bname !== "" || song !== "") {
    state_string =   "&state=" + encodeURI(JSON.stringify({"name": bname, "song": song}));
  }
    
  window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=false${state_string}`;
}

// Set up the Web Playback SDK
window.onSpotifyPlayerAPIReady = () => {
  const player = new Spotify.Player({
    name: 'Web Playback SDK Template',
    getOAuthToken: cb => { cb(_token); }
  });

  // Error handling
  player.on('initialization_error', e => console.error(e));
  player.on('authentication_error', e => console.error(e));
  player.on('account_error', e => console.error(e));
  player.on('playback_error', e => console.error(e));

  // Playback status updates
  player.on('player_state_changed', state => {
    //console.log(state);
  });

  // Ready
  player.on('ready', data => {
    if(typeof state !== 'undefined'){
      const {name, song} = JSON.parse(state);
      play(song, data.device_id, name);
      
      setupPlayerPage(name);
    } else {
      setupSearchPage(data);
    }
  });
  // Connect to the player!
  player.connect();
}

// Looks for a Richard Simmons birthday track that includes the provided name.  Plays it if successful.
function search(name, device_id) {
  $.ajax({
   url: "https://api.spotify.com/v1/search?q=Richard%20Simmons%20Birthday%20" + name + "&type=artist,track",
   type: "GET",
   beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + _token );},
   success: function(data) {
     document.getElementById('message-bar').style.display='none';

     try {
       const uri = data.tracks.items[0].uri;
       const share_link = document.getElementById('share-link');
       play(uri, device_id, name);
       
       share_link.innerHTML=`<span id="share">Share:</span> <a href='https://happy-birthday-singer.glitch.me?song=${uri}&name=${name}'>https://happy-birthday-singer.glitch.me?song=${uri}&name=${name}</a>`;
       share_link.style.display = "inline-block";
     } catch (e) {
       displayError("Birthday ruined: Could not find song for " + name);
     }
   },
    error: function(error){
      displayError("Search failed: " + JSON.parse(error.responseText).error.message);
    }
  });
}

// Play a specified track on the Web Playback SDK's device ID
function play(uri, device_id, name) {
  $.ajax({
     url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
     type: "PUT",
     data: `{"uris": ["${uri}"]}`,
     beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + _token );},
     success: function(data) {
       document.getElementById('simmons-dancing').style.display='block';
       document.getElementById('birthday-header').innerHTML=`Happy Birthday, ${name}!`;
     },
     error: function(error) {
       displayError("Playback failed: " + JSON.parse(error.responseText).error.message);
     }
  });
}

// Displays and error message in the bar at the top of the page
function displayError(message) {
  const message_bar = document.getElementById('message-bar')
  message_bar.innerHTML=message;
  message_bar.style.display = 'block';
}

function setupSearchPage(data, name) {
  document.getElementById('birthday-header').innerHTML="Whose birthday is it?";

  // Run the search when the user clicks the search button
  const play_button = document.getElementById('search-button');
  play_button.addEventListener('click', 
                               () => search(document.getElementById("search-field").value, data.device_id));


  // Run the search when the user presses enter in the search field
  document.getElementById('search-field').addEventListener('keypress', function(e){
      if (!e) e = window.event;
      var keyCode = e.keyCode || e.which;
      if (keyCode == '13'){
        search(document.getElementById("search-field").value, data.device_id);
        return false;
      }
    });

    // Show the search area after the player finishes loading
    document.getElementById('loading').style="display:none;";
    document.getElementById("search-group").classList.remove("hidden");
}

function setupPlayerPage(name) {
  document.getElementById('loading').style.display="none";
  document.getElementById('home-link').classList.remove('hidden');
}