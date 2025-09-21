<h1>🗣️ TalkAI — Realtime AI Chat Application</h1>

<p align="center">
  <a href="https://nodejs.org/"><img alt="Node" src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white"></a>
  <a href="https://expressjs.com/"><img alt="Express" src="https://img.shields.io/badge/Express.js-Server-000000?logo=express&logoColor=white"></a>
  <a href="https://www.mongodb.com/"><img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white"></a>
  <a href="https://socket.io/"><img alt="Socket.io" src="https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white"></a>
  <a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=061A23"></a>
  <a href="https://redux-toolkit.js.org/"><img alt="Redux Toolkit" src="https://img.shields.io/badge/Redux%20Toolkit-State-764ABC?logo=redux&logoColor=white"></a>
  <a href="https://vitejs.dev/"><img alt="Vite" src="https://img.shields.io/badge/Vite-Dev-646CFF?logo=vite&logoColor=white"></a>
  <a href="https://tailwindcss.com/"><img alt="Tailwind" src="https://img.shields.io/badge/TailwindCSS-UI-38B2AC?logo=tailwindcss&logoColor=white"></a>
  <a href="https://github.com/UKbhatt/TalkAi/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/UKbhatt/TalkAi?style=social"></a>
</p>

<p align="center">💬 Chat with AI, manage conversations, and collaborate in realtime with typing indicators, presence, and notifications.</p>

---

## ✨ Features

- 🔐 **Auth** — Sign up / Sign in with JWT, bcrypt, protected routes
- 💾 **Persistence** — Users, conversations, messages in MongoDB Atlas
- ⚡ **Realtime** — Socket.IO for live messages, delivery events, read receipts
- 🧠 **AI Messages** — Plug any LLM provider via a clean service layer
- 🗂️ **Redux Toolkit** — Global state, slices for auth/chat/notifications
- 🎨 **UI/UX** — TailwindCSS, icons via `lucide-react`, dark mode-ready
- 🛡️ **Security** — Helmet, CORS, rate-limit, input validation
- 🧪 **DX** — Vite fast dev, ESLint, consistent scripts

---

## 📂 File Structure

```
TalkAi/
├─ backend/ # Express API + Socket.IO
│ ├─ routes/ # auth, chat, user
│ ├─ models/ # User, Conversation, Message
│ ├─ middleware/ # auth (JWT), validators
│ ├─ server.js # app bootstrap
│ └─ .env # backend env (not committed)
└─ frontend/ # React + Vite
├─ src/
│ ├─ components/ # UI components
│ ├─ pages/ # routed pages
│ ├─ services/ # ApiService, socket client
│ └─ store/ # Redux Toolkit slices
└─ .env # frontend env (not committed)
```


---

## 🔧 Requirements

- Node.js **18+**
- npm **9+**
- MongoDB Atlas cluster (or local MongoDB 6/7)
- (Optional) LLM provider key if you wire AI responses
---

## ⚙️ Environment Variables

### `backend/.env`

**MongoDB Atlas (SRV string) — include a database name**
```env
MONGODB_URI=mongodb+srv://<user>:<ENCODED_PASS>@cluster0.xxxxx.mongodb.net/talkai?retryWrites=true&w=majority&appName=TalkAI
```
Server
```
PORT=5000
NODE_ENV=development
```
Auth
```
JWT_SECRET=<long_random_secret>
```
CORS
```
FRONTEND_ORIGIN=http://localhost:5173
```
---

## 🚀 Quick Start (Windows CMD)

### 1) Clone
```cmd
git clone https://github.com/UKbhatt/TalkAi
cd TalkAi
```
### 2) Install (root → backend → frontend)
REM Backend deps
```
cd backend
npm install
```
REM Frontend deps
```
cd ..\frontend
npm install
```
3) Configure .env files<br>
Create backend\.env and frontend\.env using the templates above.
4) Run (two terminals)
Terminal 1 — Backend
```
cd TalkAi\backend
npm run dev
```
Terminal 2 — Frontend
```
cd TalkAi\frontend
npm run dev
```

---

📦 Scripts
```
Backend (/backend/package.json)
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "lint": "eslint ."
  }
}
```
```
Frontend (/frontend/package.json)
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  }
}
```
----

## 🔌 API (REST)
```

| Method | Route                     | Auth  | Description                     
|--------|---------------------------|:----: |---------------------------------
| POST   | `/api/auth/register`      |  ❌  | Create account                  
| POST   | `/api/auth/login`         |  ❌  | Obtain JWT                     
| GET    | `/api/user/me`            |  ✅  | Current user profile            
| GET    | `/api/chat/conversations` |  ✅  | List conversations              
| POST   | `/api/chat/message`       |  ✅  | Send message (triggers realtime)
| GET    | `/api/health`             |  ❌  | Health check                    
```
## 📡 Realtime (Socket.IO)

Connect with:
```
import { io } from "socket.io-client";
const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: { token: localStorage.getItem('token') }
});
```

---

## 🎯 UI Highlights

- 📂 Left panel with conversations  
- 💬 Chat area with message bubbles, timestamps, and delivery ticks  
- 🔔 Top-right credits & notifications (expandable panel)  
- 🛡️ Protected routes (React Router) + Redux Toolkit for state management  


---


## 🛠️ Troubleshooting

- ❌ CORS error: set FRONTEND_ORIGIN in backend/.env to your UI origin (e.g., http://localhost:5173) and ensure CORS middleware is applied before routes.

- 🗝️ JWT invalid: confirm JWT_SECRET and token prefix Bearer.

- 🌐 Mongo connect fail: Atlas IP Access List must include your IP. Ensure SRV has a database name (e.g., /talkai) and password is URL-encoded.

- ⚠️ Index warnings: avoid duplicate unique definitions (either unique:true on fields or schema.index(...), not both). Run Model.syncIndexes() once after changes.


---

## 👨‍💻 Contributing
#### 💡 Want to improve this project? Feel free to contribute!<br>
1.Fork the repository<br>
2.Create a new branch (git checkout -b feature/your-feature)<br>
3.Make your changes and commit (git commit -am 'Added a new feature')<br>
4.Push the branch (git push origin feature/your-feature)<br>
5.Submit a Pull Request<br> 

---

## 🌍 Contact
**💻 Author: Utkarsh**<br>
**📧 Email: ubhatt2004@gmail.com**<br>
**🐙 GitHub: https://github.com/UKbhatt**<br>
