# Word Builder Game - 2 Player Word Game

A mobile word game where 2 players create subwords from a randomly generated word. Features both Player vs Player and Player vs Computer modes with AI opponent.

## 🎮 Game Features

- **Player vs Player Mode**: Local pass-and-play on same device
- **Player vs Computer Mode**: Play against AI with 3 difficulty levels
  - Easy: Computer finds 3-5 short words
  - Medium: Computer finds 5-8 mixed-length words
  - Hard: Computer finds 8-12 words (prefers longer words)
- 120-second timer per turn
- Real-time word validation using dictionary API
- Score tracking (points = word length)
- Beautiful mobile-first UI

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Word Validation**: DictionaryAPI.dev + Local dictionary (2000+ words)

## 📋 Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- MongoDB (local or cloud instance)
- Expo Go app (for mobile testing)

## 🚀 Local Setup Instructions

### 1. Clone/Extract the Project

```bash
cd word-builder-game
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit backend/.env if needed (default MongoDB settings should work)

# Start MongoDB (if using local)
# mongod --dbpath /path/to/your/data

# Run the backend server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend will be available at: `http://localhost:8001`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
yarn install
# or
npm install

# Update environment variables
# Edit frontend/.env and update these:
# EXPO_PUBLIC_BACKEND_URL=http://YOUR_LOCAL_IP:8001
# Replace YOUR_LOCAL_IP with your machine's local IP (e.g., 192.168.1.10)

# Start Expo development server
npx expo start
```

### 4. Test on Mobile Device

1. Install **Expo Go** app from App Store (iOS) or Play Store (Android)
2. Make sure your phone is on the same WiFi network as your computer
3. Scan the QR code shown in the terminal
4. The app will load on your phone

### 5. Test on Simulator/Emulator

```bash
# iOS Simulator (Mac only)
npx expo start --ios

# Android Emulator
npx expo start --android

# Web (limited mobile features)
npx expo start --web
```

## 📁 Project Structure

```
word-builder-game/
├── backend/
│   ├── server.py              # FastAPI backend with all game logic
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
├── frontend/
│   ├── app/
│   │   ├── index.tsx          # Home screen
│   │   ├── setup.tsx          # Player setup & mode selection
│   │   ├── game.tsx           # Main game screen
│   │   └── results.tsx        # Results screen
│   ├── assets/                # Images and assets
│   ├── package.json           # Frontend dependencies
│   ├── app.json              # Expo configuration
│   └── .env                   # Frontend environment variables
└── README.md                  # This file
```

## 🎯 How to Play

### Player vs Player Mode
1. Select "Player vs Player"
2. Enter both player names
3. Player 1 creates words from the main word (120 seconds)
4. Submit words using the input field
5. Click "End Turn" when done
6. Player 2 takes their turn
7. Highest score wins!

### Player vs Computer Mode
1. Select "Player vs Computer"
2. Choose difficulty (Easy/Medium/Hard)
3. Enter your name
4. Take your turn (120 seconds)
5. Computer automatically plays its turn
6. Compare scores to see who wins!

### Game Rules
- Words must be at least 3 letters long
- Words can only use letters from the main word
- Each letter can be used only as many times as it appears in the main word
- Points = word length (e.g., "cat" = 3 points, "table" = 5 points)
- Only valid English words count (verified by dictionary)

## 🔧 Configuration

### Backend Environment Variables (backend/.env)

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=word_game_db
```

### Frontend Environment Variables (frontend/.env)

```env
EXPO_PUBLIC_BACKEND_URL=http://YOUR_LOCAL_IP:8001
```

**Important**: Replace `YOUR_LOCAL_IP` with your machine's local IP address (e.g., `192.168.1.10`). This allows your phone to connect to your local backend.

To find your local IP:
- **Mac/Linux**: Run `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows**: Run `ipconfig` and look for "IPv4 Address"

## 🧪 Testing

### Backend API Testing

Test endpoints using curl:

```bash
# Health check
curl http://localhost:8001/api/

# Create a game
curl -X POST http://localhost:8001/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"player1_name":"Alice","player2_name":"Bob","mode":"pvp"}'

# Create PvC game
curl -X POST http://localhost:8001/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"player1_name":"You","player2_name":"Computer","mode":"pvc","difficulty":"medium"}'

# Test computer turn (replace GAME_ID)
curl -X POST http://localhost:8001/api/game/computer-turn \
  -H "Content-Type: application/json" \
  -d '{"game_id":"GAME_ID","difficulty":"medium"}'
```

## 📊 Backend API Endpoints

- `GET /api/` - Health check
- `POST /api/game/create` - Create new game
- `GET /api/game/{game_id}` - Get game state
- `POST /api/game/submit-word` - Submit a word
- `POST /api/game/switch-turn` - Switch to next player
- `POST /api/game/computer-turn` - Generate computer words
- `POST /api/validate-word` - Validate a word

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**:
- Make sure MongoDB is running: `mongod --version`
- Check MONGO_URL in backend/.env
- Try connecting manually: `mongosh mongodb://localhost:27017`

**Port 8001 Already in Use**:
- Kill the process: `lsof -ti:8001 | xargs kill -9` (Mac/Linux)
- Or change the port in uvicorn command

### Frontend Issues

**Can't Connect to Backend**:
- Verify backend is running on port 8001
- Check EXPO_PUBLIC_BACKEND_URL has correct IP
- Make sure phone and computer are on same WiFi
- Try using actual IP instead of localhost

**Expo Go Not Loading**:
- Restart Expo dev server: `npx expo start -c`
- Clear Expo cache: `npx expo start --clear`
- Reinstall Expo Go app

**"Network Request Failed" Errors**:
- Check if backend is accessible from your phone
- Test backend URL in phone browser: `http://YOUR_IP:8001/api/`
- Disable VPN if enabled

## 🎨 Game Screenshots

The app features:
- Dark theme with green accents
- Mobile-optimized touch controls
- Real-time score updates
- Animated computer "thinking" overlay
- Clean, modern UI design

## 💡 Development Tips

- Backend auto-reloads on file changes (--reload flag)
- Frontend hot-reloads automatically via Expo
- Use `console.log()` for debugging frontend
- Check `/var/log/` or terminal output for backend logs
- Test on real devices for best experience

## 📝 License

This project was created as a demonstration word game application.

## 🤝 Contributing

Feel free to fork, modify, and enhance the game!

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure MongoDB is running
4. Check that all environment variables are set correctly

## 🎉 Credits

- Dictionary API: [DictionaryAPI.dev](https://dictionaryapi.dev/)
- Built with Expo, React Native, and FastAPI
- Local word dictionary with 2000+ English words

---

**Enjoy playing Word Builder! 🎮📝**
