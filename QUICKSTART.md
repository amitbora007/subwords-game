# Quick Start Guide - Word Builder Game

## 📦 What's Included

This package contains a complete 2-player word game with:
- **Player vs Player** mode (local multiplayer)
- **Player vs Computer** mode with 3 difficulty levels
- Mobile-first React Native frontend
- FastAPI backend with MongoDB

## ⚡ Quick Setup (5 Minutes)

### Step 1: Install Prerequisites

**Required Software:**
- **Node.js** v16+: https://nodejs.org/
- **Python** 3.8+: https://www.python.org/
- **MongoDB**: https://www.mongodb.com/try/download/community
- **Expo Go** app on your phone: App Store / Play Store

### Step 2: Extract & Navigate

```bash
unzip word-builder-game.zip
cd word-builder-game
```

### Step 3: Start MongoDB

```bash
# Mac
brew services start mongodb-community

# Windows
net start MongoDB

# Linux
sudo systemctl start mongod

# Or run manually
mongod --dbpath /path/to/your/data
```

### Step 4: Start Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Keep this terminal open! Backend runs on http://localhost:8001

### Step 5: Configure Frontend

**Find your local IP address:**

```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

Look for something like `192.168.1.10` (your IPv4 address)

**Edit frontend/.env:**
```env
EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP_HERE:8001
```

Replace `YOUR_IP_HERE` with your actual IP (e.g., `192.168.1.10`)

### Step 6: Start Frontend

Open a **new terminal**:

```bash
cd frontend
yarn install    # or: npm install
npx expo start
```

### Step 7: Test on Phone

1. Open **Expo Go** app on your phone
2. Make sure phone is on **same WiFi** as computer
3. Scan the QR code in terminal
4. App loads! 🎉

## 🎮 Quick Test

Once the app loads:
1. Tap "Start New Game"
2. Select "Player vs Computer"
3. Choose "Medium" difficulty
4. Enter your name
5. Tap "Start Game"
6. Create some words and watch the computer play!

## 🐛 Common Issues

**"Network request failed"**
- Make sure EXPO_PUBLIC_BACKEND_URL in frontend/.env has your correct IP
- Verify backend is running: Open http://localhost:8001/api/ in browser
- Confirm phone and computer are on same WiFi

**"Connection refused"**
- Check MongoDB is running: `mongosh` (should connect)
- Restart backend server
- Try http://YOUR_IP:8001/api/ in phone browser

**Expo won't start**
- Clear cache: `npx expo start --clear`
- Delete node_modules: `rm -rf node_modules && yarn install`

## 📱 Alternative: Test on Simulator

**iOS (Mac only):**
```bash
npx expo start --ios
```

**Android:**
```bash
npx expo start --android
```

## 📊 Test Backend API

```bash
# Health check
curl http://localhost:8001/api/

# Create a game
curl -X POST http://localhost:8001/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"player1_name":"Alice","player2_name":"Bob","mode":"pvp"}'
```

## 📁 File Structure

```
word-builder-game/
├── backend/
│   ├── server.py           # All game logic
│   ├── requirements.txt    # Python packages
│   └── .env               # MongoDB config
├── frontend/
│   ├── app/
│   │   ├── index.tsx      # Home screen
│   │   ├── setup.tsx      # Mode selection
│   │   ├── game.tsx       # Main game
│   │   └── results.tsx    # Winner screen
│   └── .env              # Backend URL
└── README.md             # Full documentation
```

## 🎯 Game Rules

- Create words from the main word (min 3 letters)
- Each valid word scores points = word length
- 120 seconds per turn
- Highest score wins!

## 💡 Pro Tips

1. **Backend** must run before frontend
2. **Same WiFi** for phone and computer
3. **Real IP** not localhost in .env
4. Test backend in browser first: http://localhost:8001/api/

## 📖 Full Documentation

See `README.md` for:
- Complete API documentation
- Advanced configuration
- Troubleshooting guide
- Development tips

## 🆘 Need Help?

1. Check MongoDB is running
2. Verify backend responds at http://localhost:8001/api/
3. Confirm .env has correct IP address
4. Make sure phone/computer same WiFi
5. Try clearing Expo cache

---

**Ready to play! 🎮 Start with backend, then frontend, then scan QR code!**
