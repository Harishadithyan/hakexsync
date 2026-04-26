# ⬡ HakexSync

> Smart synchronization platform — monitor and manage devices in real-time via a single mobile interface.

Built with **React (Vite)** + **Firebase** (Auth · Firestore · Realtime Database · Storage).

---

## 📁 Project Structure

```
hakexsync/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AppLayout.jsx       # Bottom nav shell + route outlet
│   │   ├── DeviceCard.jsx      # Device list card with live metrics
│   │   ├── DeviceModal.jsx     # Add / Edit device bottom sheet
│   │   ├── Header.jsx          # Sticky top header
│   │   ├── ProtectedRoute.jsx  # Auth guard wrapper
│   │   └── UI.jsx              # Button, Input, Select, Toggle, StatusPill…
│   ├── context/
│   │   ├── AuthContext.jsx     # Global Firebase auth state
│   │   └── ToastContext.jsx    # Global toast notifications
│   ├── hooks/
│   │   └── useDevices.js       # Firestore + RTDB real-time device hook
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DeviceDetail.jsx    # Live chart + telemetry + CRUD
│   │   ├── Sync.jsx            # Manual sync + per-device progress
│   │   ├── Alerts.jsx          # Auto-detected threshold alerts
│   │   └── Profile.jsx         # User info + settings toggles
│   ├── services/
│   │   ├── firebase.js         # ← PUT YOUR CONFIG HERE
│   │   ├── authService.js      # signUp / signIn / logOut / parseError
│   │   └── deviceService.js    # Firestore CRUD + RTDB telemetry
│   ├── styles/
│   │   └── globals.css         # CSS variables + keyframes
│   ├── App.jsx                 # BrowserRouter + all routes
│   └── main.jsx                # ReactDOM entry
├── firestore.rules             # Firestore security rules
├── database.rules.json         # RTDB security rules
├── firebase.json               # Hosting + deploy config
├── .env.example                # Env var template
├── vite.config.js
└── package.json
```

---

## 🚀 Quick Start

### 1 — Clone & install

```bash
git clone https://github.com/you/hakexsync.git
cd hakexsync
npm install
```

### 2 — Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → give it a name (e.g. `hakexsync`)
3. Enable **Google Analytics** (optional)

### 3 — Enable Firebase services

Inside your project:

| Service | Steps |
|---|---|
| **Authentication** | Build → Authentication → Get started → Sign-in method → **Email/Password** → Enable |
| **Firestore** | Build → Firestore Database → Create database → Start in **test mode** (update rules before prod) |
| **Realtime Database** | Build → Realtime Database → Create database → Start in **test mode** |
| **Storage** *(optional)* | Build → Storage → Get started |

### 4 — Add your Firebase config

Copy your SDK config from:
**Firebase Console → Project Settings → General → Your apps → Web app → SDK setup**

Open `src/services/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "hakexsync.firebaseapp.com",
  databaseURL:       "https://hakexsync-default-rtdb.firebaseio.com",
  projectId:         "hakexsync",
  storageBucket:     "hakexsync.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123",
};
```

> **Tip:** You can also use `.env` — copy `.env.example` to `.env` and fill in values, then update `firebase.js` to use `import.meta.env.VITE_FIREBASE_*`.

### 5 — Deploy Firestore security rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # select your project
firebase deploy --only firestore:rules,database
```

### 6 — Run the dev server

```bash
npm run dev
# → http://localhost:5173
```

---

## 🔐 Authentication Flow

```
/login  →  signInWithEmailAndPassword()  →  /dashboard
/signup →  createUserWithEmailAndPassword()
          + updateProfile() (display name)
          + setDoc() (Firestore users/{uid})
          →  /dashboard
```

`AuthContext` wraps the entire app in `onAuthStateChanged`. `ProtectedRoute` redirects unauthenticated users to `/login` automatically.

---

## 📊 Data Model

### Firestore — `devices/{deviceId}`

```json
{
  "ownerId":      "uid_of_user",
  "name":         "Server Alpha",
  "type":         "server",
  "location":     "Data Center A",
  "status":       "online",
  "syncProgress": 92,
  "uptime":       "99.2%",
  "alerts":       0,
  "createdAt":    "<Timestamp>",
  "lastSeen":     "<Timestamp>"
}
```

### Realtime Database — `telemetry/{deviceId}`

```json
{
  "cpu":       67.4,
  "mem":       78.1,
  "temp":      42.0,
  "timestamp": 1720000000000
}
```

---

## ⚡ Real-Time Architecture

```
Firebase RTDB
  └─ telemetry/{deviceId}
       └─ onValue() ──► useDevices hook ──► DeviceCard (live metrics)
                                        └─► DeviceDetail (live chart)

Firebase Firestore
  └─ devices/ (user's devices)
       └─ onSnapshot() ──► useDevices hook ──► Dashboard list
```

Every UI component receiving device data is **zero-refresh** — it updates automatically via Firebase listeners.

---

## 🏗️ Build & Deploy

```bash
npm run build          # outputs to /dist

firebase deploy        # deploys hosting + rules
```

---

## 🎨 Design Tokens

```
--primary:   #2F2FE4   (brand blue)
--secondary: #162E93   (deep blue)
--accent:    #1A1953   (dark accent)
--dark:      #080616   (background)
--green:     #10F595   (online / success)
--red:       #FF4D6A   (offline / error)
--amber:     #FFB830   (warning)
--cyan:      #00D4FF   (CPU metric)
--purple:    #9B7AFF   (sync / secondary)
```

Font stack: **Syne** (headings, brand) + **DM Sans** (body).

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `firebase` | Auth, Firestore, RTDB, Storage |
| `react-router-dom` | Client-side routing |
| `recharts` | Live telemetry line chart |
| `vite` + `@vitejs/plugin-react` | Build tooling |
