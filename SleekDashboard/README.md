# Flitster: Song Guessing Game

A modern, interactive music guessing game powered by Spotify. Challenge yourself and friends to identify songs from curated playlists!

## Features

🎵 **Multiple Playlists**: Choose from 5 curated music collections:
- Millennial Hits
- Top 2000 Classics  
- Hip Hop Hidden Gems
- After 2000 Modern Hits
- Party All Time

🎮 **Dual Playback Modes**:
- **Web Player**: Works for all Spotify users in your browser
- **Native Spotify**: Plays through your Spotify app (Premium required) - Hitster-style experience for easy song liking

📱 **Responsive Design**: Beautiful, modern interface that works perfectly on mobile, tablet, and desktop

🎨 **Spotify-Themed UI**: Authentic Spotify design with smooth animations and gradients

## How to Play

1. Choose your preferred playlist from the dropdown
2. Select your playback mode (Web Player or Native Spotify)
3. Click "Start Game" to begin
4. Listen to the track and make your guess
5. Click "Show Answer" to reveal the song and artist
6. Use "Next Track" to continue playing

## Technology Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: Spotify Web API & Web Playback SDK
- **Styling**: Bootstrap 5 with custom Spotify theming
- **Authentication**: OAuth 2.0 with Spotify

## Setup Instructions

### Prerequisites
- Python 3.11+
- Spotify Developer Account
- Spotify Premium (for Native Spotify mode)

### Environment Variables
Create a `.env` file with:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SESSION_SECRET=your_random_session_secret
```

### Installation
1. Clone this repository
2. Install dependencies: `pip install -r requirements.txt`
3. Set up your environment variables
4. Run the application: `python main.py`
5. Visit `http://localhost:5000`

### Spotify App Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:5000/callback`
4. Copy Client ID and Client Secret to your `.env` file

## Deployment

This app is ready for deployment on:
- **Vercel** (recommended for ease)
- **Railway** (great for Flask apps)
- **Render** 
- **Netlify**

Remember to update your Spotify app settings with the production callback URL.

## Live Demo

Try the game live: [Your deployment URL here]

## Contributing

Feel free to fork this project and submit pull requests for improvements!

## License

MIT License - Feel free to use this project for personal or commercial purposes.

---

Built with ❤️ and Spotify API