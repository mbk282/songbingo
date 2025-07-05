let deviceId = null;
let currentTrack = null;
let currentPlaylist = "";
let playerReady = false;
let playbackMode = 'web'; // 'web' or 'native'

// UI Update Functions
function updatePlayerStatus(message, isLoading = false) {
    const statusElement = document.getElementById("playerStatus");
    const spinner = statusElement.querySelector(".loading-spinner");
    const statusText = statusElement.querySelector(".status-text");
    
    statusText.textContent = message;
    spinner.style.display = isLoading ? "block" : "none";
}

function showTrackInfo(show = true) {
    const trackInfo = document.getElementById("trackInfo");
    trackInfo.style.display = show ? "block" : "none";
}

function enableControls() {
    document.getElementById("startBtn").disabled = false;
    document.getElementById("nextBtn").disabled = false;
    updatePlayerStatus("✅ Spotify Player Ready - Start your game!", false);
}

function disableControls() {
    document.getElementById("startBtn").disabled = true;
    document.getElementById("nextBtn").disabled = true;
}

// Spotify Web Playback SDK
window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
        name: 'Spotify Guess Game Player',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
    });

    // Ready event
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        deviceId = device_id;
        playerReady = true;
        enableControls();
    });

    // Not Ready event
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        updatePlayerStatus("❌ Player disconnected", false);
        disableControls();
    });

    // Player state changes
    player.addListener('player_state_changed', (state) => {
        if (!state) return;
        
        const { paused, position, duration } = state;
        
        if (!paused && currentTrack) {
            showTrackInfo(true);
        }
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize:', message);
        updatePlayerStatus("❌ Failed to initialize player", false);
    });

    player.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate:', message);
        updatePlayerStatus("❌ Authentication failed", false);
    });

    player.addListener('account_error', ({ message }) => {
        console.error('Failed to validate account:', message);
        updatePlayerStatus("❌ Account validation failed", false);
    });

    player.addListener('playback_error', ({ message }) => {
        console.error('Failed to perform playback:', message);
        updatePlayerStatus("❌ Playback failed", false);
    });

    // Connect to the player
    player.connect().then(success => {
        if (success) {
            console.log('Successfully connected to Spotify!');
        } else {
            console.error('Failed to connect to Spotify');
            updatePlayerStatus("❌ Failed to connect to Spotify", false);
        }
    });
};

// Game Functions
function startGame() {
    const playlist = document.getElementById("playlist").value.trim();
    if (!playerReady || !playlist) {
        if (!playlist) {
            alert("Please enter a Spotify playlist URL");
        }
        return;
    }
    
    currentPlaylist = playlist;
    updatePlayerStatus("🎵 Loading random track...", true);
    loadAndPlayRandomTrack();
}

function nextTrack() {
    if (currentPlaylist && playerReady) {
        updatePlayerStatus("🎵 Loading next track...", true);
        hideAnswer();
        loadAndPlayRandomTrack();
    }
}

function loadAndPlayRandomTrack() {
    fetch("/get-random-track?playlist_url=" + encodeURIComponent(currentPlaylist))
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            currentTrack = data;
            hideAnswer();
            showTrackInfo(false); // Hide until track starts playing
            
            // Choose playback method based on mode
            if (playbackMode === 'web') {
                // Web Player Mode - play through web SDK device
                if (!deviceId) {
                    throw new Error('Web player not ready');
                }
                return fetch('https://api.spotify.com/v1/me/player/play?device_id=' + deviceId, {
                    method: 'PUT',
                    body: JSON.stringify({ uris: [data.uri] }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + accessToken
                    },
                });
            } else {
                // Native Spotify Mode - play on user's active device
                return fetch('https://api.spotify.com/v1/me/player/play', {
                    method: 'PUT',
                    body: JSON.stringify({ uris: [data.uri] }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + accessToken
                    },
                });
            }
        })
        .then(response => {
            if (!response.ok) {
                if (playbackMode === 'native' && response.status === 404) {
                    throw new Error('No active Spotify device found. Please open Spotify on your phone/computer.');
                } else if (playbackMode === 'native' && response.status === 403) {
                    throw new Error('Spotify Premium required for native playback.');
                }
                throw new Error('Failed to play track');
            }
            
            const statusMessage = playbackMode === 'web' 
                ? "🎵 Track playing in browser - Make your guess!" 
                : "🎵 Track playing in Spotify app - Make your guess!";
            updatePlayerStatus(statusMessage, false);
            showTrackInfo(true);
        })
        .catch(error => {
            console.error('Error loading track:', error);
            updatePlayerStatus(`❌ Error: ${error.message}`, false);
            showTrackInfo(false);
        });
}

function pauseTrack() {
    let pauseUrl;
    if (playbackMode === 'web' && deviceId) {
        pauseUrl = 'https://api.spotify.com/v1/me/player/pause?device_id=' + deviceId;
    } else {
        pauseUrl = 'https://api.spotify.com/v1/me/player/pause';
    }
    
    fetch(pauseUrl, {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => {
        if (response.ok) {
            updatePlayerStatus("⏸️ Track paused", false);
        }
    })
    .catch(error => {
        console.error('Error pausing track:', error);
    });
}

function replayTrack() {
    if (currentTrack) {
        let playUrl;
        if (playbackMode === 'web' && deviceId) {
            playUrl = 'https://api.spotify.com/v1/me/player/play?device_id=' + deviceId;
        } else {
            playUrl = 'https://api.spotify.com/v1/me/player/play';
        }
        
        fetch(playUrl, {
            method: 'PUT',
            body: JSON.stringify({ 
                uris: [currentTrack.uri],
                position_ms: 0 // Start from beginning
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
        })
        .then(response => {
            if (response.ok) {
                const statusMessage = playbackMode === 'web' 
                    ? "🔄 Track replaying in browser" 
                    : "🔄 Track replaying in Spotify app";
                updatePlayerStatus(statusMessage, false);
                showTrackInfo(true);
            }
        })
        .catch(error => {
            console.error('Error replaying track:', error);
        });
    }
}

function showAnswer() {
    if (currentTrack) {
        const answerElement = document.getElementById("answer");
        const answerContent = document.getElementById("answerContent");
        
        answerContent.innerHTML = `
            <strong>${currentTrack.name}</strong><br>
            by ${currentTrack.artist}<br>
            <small>(${currentTrack.year})</small>
        `;
        
        answerElement.style.display = "block";
        answerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function hideAnswer() {
    document.getElementById("answer").style.display = "none";
}

// Playlist Selection Functions
function selectPresetPlaylist() {
    const presetSelect = document.getElementById("presetPlaylist");
    const customSection = document.getElementById("customUrlSection");
    const playlistInput = document.getElementById("playlist");
    const customInput = document.getElementById("customPlaylist");
    
    const selectedValue = presetSelect.value;
    
    if (selectedValue === "custom") {
        // Show custom URL input
        customSection.style.display = "flex";
        playlistInput.value = "";
        customInput.focus();
    } else {
        // Preset playlist selected
        customSection.style.display = "none";
        playlistInput.value = selectedValue;
    }
}

function updatePlaylistFromCustom() {
    const customInput = document.getElementById("customPlaylist");
    const playlistInput = document.getElementById("playlist");
    playlistInput.value = customInput.value;
}

// Playback Mode Functions
function updatePlaybackMode() {
    const webPlayerRadio = document.getElementById("webPlayer");
    const nativePlayerRadio = document.getElementById("nativePlayer");
    const infoText = document.getElementById("playbackModeInfo");
    
    if (webPlayerRadio.checked) {
        playbackMode = 'web';
        infoText.textContent = "Web Player works in your browser for all Spotify users";
    } else if (nativePlayerRadio.checked) {
        playbackMode = 'native';
        infoText.textContent = "Native Spotify plays through your Spotify app (Premium required, easier to like songs)";
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updatePlayerStatus("🔄 Initializing Spotify Player...", true);
    
    // Add enter key support for custom playlist input
    const customPlaylistInput = document.getElementById("customPlaylist");
    if (customPlaylistInput) {
        customPlaylistInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                updatePlaylistFromCustom();
                if (!document.getElementById("startBtn").disabled) {
                    startGame();
                }
            }
        });
        
        // Update hidden input when custom URL changes
        customPlaylistInput.addEventListener('input', updatePlaylistFromCustom);
    }
    
    // Add event listeners for playback mode selection
    const webPlayerRadio = document.getElementById("webPlayer");
    const nativePlayerRadio = document.getElementById("nativePlayer");
    
    if (webPlayerRadio) {
        webPlayerRadio.addEventListener('change', updatePlaybackMode);
    }
    if (nativePlayerRadio) {
        nativePlayerRadio.addEventListener('change', updatePlaybackMode);
    }
    
    // Initialize playback mode info
    updatePlaybackMode();
});
