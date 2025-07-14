
# 📹 React WebRTC Video Calling App

A full-stack real-time video calling app built using **React.js**, **WebRTC**, **Socket.IO**, and **Node.js**. This project enables real-time peer-to-peer video/audio communication, screen sharing, and messaging between users.

---

## 🚀 Features

- ✅ Real-time video & audio call
- 🔇 Mute/Unmute Microphone
- 📷 Turn On/Off Camera
- 📺 Screen Sharing functionality
- 💬 Chat Messaging during call
- 🔄 Auto Peer Negotiation (for track changes)
- ❌ End Call & Disconnect handling
- 🎨 Clean UI with connection status indicators

---

## 🛠️ Technologies Used

### 👨‍💻 Frontend (React)

- **React.js** – component-based SPA
- **React Hooks** – useState, useEffect, useCallback
- **ReactPlayer** – rendering media streams
- **CSS** – for UI styling

### 🌐 Backend (Node.js)

- **Node.js + Express.js** – backend server
- **Socket.IO** – real-time signaling and chat
- **CORS** – cross-origin resource sharing

### 📡 WebRTC

- **RTCPeerConnection** – for peer-to-peer streaming
- **getUserMedia()** – to access camera and mic
- **getDisplayMedia()** – for screen sharing
- **replaceTrack(), addTrack(), removeTrack()** – stream management

---

## 📁 Folder Structure

```
webRTC-main/
├── client/
│   └── src/
│       ├── context/SocketProvider.jsx
│       ├── screens/RoomPage.jsx, Lobby.jsx, Room.jsx
│       ├── service/peer.js
│       └── App.js, index.js, styles
├── server/
│   ├── index.js
│   └── package.json
└── README.md
```

---

## 🧠 Concepts Implemented

- Peer connection using `RTCPeerConnection`
- SDP offer/answer exchange
- Dynamic track management (add/remove/replace)
- Media control with toggle mic/cam
- Screen sharing with automatic fallback
- Socket.IO signaling flow
- Chat feature with socket events
- React state syncing + cleanup

---

## ▶️ How to Run the Project

### 1️⃣ Clone the Repo

```
git clone https://github.com/Amit046/React-webRTC
cd React-webRTC-main
```

### 2️⃣ Setup Server

```
cd server
npm install
node index.js
```

Runs on: `http://localhost:5000`

### 3️⃣ Setup Client

Open a **new terminal**:

```
cd client
npm install
npm start
```

Runs on: `http://localhost:3000`

### 4️⃣ Usage

- Open the app in **two different browsers or tabs**
- Click **Call** to start a connection
- Toggle mic, camera, and screen share

---

## 🧪 Future Improvements

- Add TURN/STUN servers for production
- UI improvements and animations
- Authentication and private rooms
- Multi-user group calls

---

## 🌐 GitHub Repo

🔗 [View Project on GitHub](https://github.com/Amit046/React-webRTC)

---

## 🙌 Contribution & Feedback

Feel free to fork, open issues, or submit PRs.
Also, I’d love your feedback or suggestions on LinkedIn!

---

**Made with ❤️ by [Amit](https://github.com/Amit046)**

#ReactJS #WebRTC #SocketIO #NodeJS #VideoCall #RealTimeCommunication #FullStack
