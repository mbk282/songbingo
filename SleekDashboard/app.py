import os
import random
import requests
from flask import Flask, redirect, request, session, render_template, jsonify
from urllib.parse import urlencode

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", os.urandom(24))

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
# Use environment variable for redirect URI to support different deployment environments
# For Replit, we need to use the proper domain
REDIRECT_URI = os.getenv("REDIRECT_URI", f"https://{os.getenv('REPLIT_DEV_DOMAIN', 'localhost:5000')}/callback")

AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
API_BASE = "https://api.spotify.com/v1"

SCOPE = "streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state"

@app.route("/")
def index():
    if "access_token" not in session:
        return redirect("/login")
    return render_template("index.html", access_token=session["access_token"])

@app.route("/login")
def login():
    # Debug information
    print(f"CLIENT_ID: {CLIENT_ID}")
    print(f"REDIRECT_URI: {REDIRECT_URI}")
    
    if not CLIENT_ID or not CLIENT_SECRET:
        return jsonify({"error": "Spotify credentials not configured"}), 500
    
    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPE,
        "show_dialog": "true"  # Force login dialog
    }
    auth_url = f"{AUTH_URL}?{urlencode(params)}"
    print(f"Auth URL: {auth_url}")
    return redirect(auth_url)

@app.route("/callback")
def callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Authorization code not provided"}), 400
    
    response = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
    )
    
    if response.status_code != 200:
        return jsonify({"error": "Failed to get access token"}), 400
    
    response_data = response.json()
    session["access_token"] = response_data.get("access_token")
    return redirect("/")

@app.route("/get-random-track")
def get_random_track():
    if "access_token" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    playlist_url = request.args.get("playlist_url")
    if not playlist_url:
        return jsonify({"error": "Playlist URL is required"}), 400
    
    # Extract playlist ID from URL
    try:
        playlist_id = playlist_url.split("/")[-1].split("?")[0]
    except:
        return jsonify({"error": "Invalid playlist URL format"}), 400
    
    headers = {"Authorization": f"Bearer {session['access_token']}"}
    
    try:
        r = requests.get(f"{API_BASE}/playlists/{playlist_id}/tracks", headers=headers)
        r.raise_for_status()
    except requests.exceptions.RequestException:
        return jsonify({"error": "Failed to fetch playlist tracks"}), 500
    
    data = r.json()
    items = data.get("items", [])
    
    if not items:
        return jsonify({"error": "No tracks found in playlist"}), 404

    # Filter out tracks that are None (removed/unavailable tracks)
    valid_tracks = [item for item in items if item.get("track") and item["track"].get("uri")]
    
    if not valid_tracks:
        return jsonify({"error": "No playable tracks found in playlist"}), 404

    track_item = random.choice(valid_tracks)
    track = track_item["track"]
    
    return {
        "uri": track["uri"],
        "name": track["name"],
        "artist": track["artists"][0]["name"] if track["artists"] else "Unknown Artist",
        "year": track["album"]["release_date"][:4] if track["album"].get("release_date") else "Unknown",
    }

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
