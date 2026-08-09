# 💬 PulseChat - Real-Time Chat Application

A modern, high-performance real-time chat application built with **React (Vite)**, **Node.js**, **Express**, **Socket.io**, and **SQLite**.

![PulseChat Interface](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Socket.io%20%7C%20SQLite-6366f1)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Key Features

### Mandatory & Core Requirements
- ⚡ **Real-Time Communication**: Bidirectional instant messaging powered by **Socket.io** without page refreshes.
- 💾 **Message Persistence**: SQLite database stores all messages and user records permanently across server and browser restarts.
- 📜 **Chat History**: REST APIs to fetch past message threads when switching rooms or refreshing the browser.
- 🕒 **Timestamps & Date Headings**: Formatted message timestamps (e.g. `10:42 AM`) and auto-grouped date badges (`Today`, `Yesterday`, etc.).
- 🛠️ **REST API Endpoints**: Full Express REST API for sending messages, logging in, fetching history, and marking read status.

### Bonus Features Included
- 👤 **Username Authentication**: Instant dummy login system with customizable avatars powered by DiceBear.
- ✍️ **Live Typing Indicators**: Real-time animated indicator showing when users are actively typing.
- 🟢 **Online/Offline User Status**: Dynamic presence detection updating contact lists live as users join or leave.
- ✔️ **Message Read Receipts**: Visual status checkmarks (`✔` sent, `✔✔` blue for read).
- 🎨 **Glassmorphism Design & Dark/Light Theme**: Sleek UI with custom CSS variables, gradients, and micro-animations.

---

## 📂 Project Structure

```
Chat Application/
├── backend/
│   ├── .env                       # Active environment configuration
│   ├── .env.example               # Environment template
│   ├── package.json
│   ├── data/                      # SQLite database storage directory
│   │   └── chat.db
│   └── src/
│       ├── server.js              # Express server & Socket.io initialization
│       ├── config/
│       │   └── db.js              # SQLite connection & schema initialization
│       ├── controllers/
│       │   ├── authController.js   # Login and user retrieval logic
│       │   └── messageController.js# History fetching & message sending logic
│       ├── routes/
│       │   ├── authRoutes.js      # Auth API endpoints
│       │   └── messageRoutes.js   # Message API endpoints
│       └── socket/
│           └── socketHandler.js   # Socket.io real-time event listeners
├── frontend/
│   ├── package.json
│   ├── vite.config.js             # Vite configuration
│   ├── index.html                 # HTML template with Google Fonts
│   └── src/
│       ├── main.jsx               # React entry point
│       ├── App.jsx                # Main application state orchestrator
│       ├── services/
│       │   ├── api.js             # REST API service client
│       │   └── socket.js          # Socket.io client manager
│       ├── components/
│       │   ├── LoginModal.jsx     # Login & Avatar selection
│       │   ├── Sidebar.jsx        # User profile, channels & direct message list
│       │   ├── ChatHeader.jsx     # Active chat title & theme toggle
│       │   ├── MessageList.jsx    # Message stream & timestamps
│       │   ├── MessageInput.jsx   # Input bar & typing emission
│       │   ├── TypingIndicator.jsx# Animated typing dots
│       │   └── ConnectionBadge.jsx# Live WebSocket status badge
│       └── styles/
│           └── index.css          # Glassmorphic CSS design system
└── README.md
```

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Node.js** (v16+ recommended)
- **npm** or **yarn**

---

### 1. Setting Up & Running the Backend

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Verify or create `.env` file (copied from `.env.example`):
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   DB_PATH=./data/chat.db
   ```
4. Start the backend server:
   ```bash
   # Production mode
   npm start

   # Development mode (auto-reload with nodemon)
   npm run dev
   ```
   > Server will start at: `http://localhost:5000`

---

### 2. Setting Up & Running the Frontend

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 🔌 API & Socket Documentation

### REST API Endpoints

| Method | Endpoint             | Description |
| :---   | :---                 | :--- |
| `POST` | `/api/auth/login`    | Login or create user by username |
| `GET`  | `/api/auth/users`    | Get all registered users with online status |
| `GET`  | `/api/messages`      | Fetch chat history (`?receiver_id=global` or direct) |
| `POST` | `/api/messages`      | Send a message via REST |
| `POST` | `/api/messages/read` | Mark message thread as read |
| `GET`  | `/api/health`        | Backend health check |

### Socket.io Real-Time Events

| Event Name | Direction | Payload / Purpose |
| :--- | :--- | :--- |
| `user_connected` | Client ➔ Server | Registers socket mapping & emits user online status |
| `send_message` | Client ➔ Server | Emits message; persisted in SQLite & broadcasted |
| `receive_message` | Server ➔ Client | Broadcasts message instantly to room/clients |
| `typing_start` | Client ➔ Server | Triggers typing indicator on remote client |
| `typing_stop` | Client ➔ Server | Clears typing indicator |
| `user_status_changed` | Server ➔ Client | Notifies client of online/offline status changes |
| `mark_read` | Client ➔ Server | Updates message read status in DB & notifies sender |

---

## 🧠 Design Decisions & Architecture Choices

1. **SQLite Database Engine (`better-sqlite3` / `sqlite3`)**:
   - Zero external dependency or service required (unlike MongoDB or PostgreSQL).
   - High performance, lightweight, and single-file storage (`/backend/data/chat.db`).
2. **Dual Delivery (Socket.io + REST API Fallback)**:
   - Primary real-time communication uses Socket.io event-driven protocol.
   - REST API endpoints are provided for history loading, initial auth, and fallback send capabilities.
3. **State & Connection Management**:
   - WebSockets join targeted room IDs (e.g. `user_id` or `global`), isolating broadcasts efficiently.
   - Frontend incorporates connection auto-reconnect handling and status badges.
4. **Vanilla CSS Design System**:
   - Custom CSS variables for theme tokens (Dark & Light modes).
   - Glassmorphism effects (`backdrop-filter`) for modern desktop & mobile interfaces.

---

## 💡 Assumptions Made

- **Authentication**: Simplified dummy login requiring a unique username and avatar choice. No complex password validation is required.
- **Channels**: All users have access to a shared `Global Workspace` room and 1-on-1 Direct Messaging threads.
- **Port Defaults**: Backend runs on `5000` and Frontend runs on `5173`.
