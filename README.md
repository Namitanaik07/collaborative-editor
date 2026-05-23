```markdown
# SyncCode Collaborative 🚀

> India's upcoming real-time multi-user code editor built for open-source workflows.

SyncCode is a full-stack, web-based collaborative environment that allows multiple developers to code together in real-time. Built using the **MERN Stack** and **Socket.io**, it mimics the core collaborative features of tools like VS Code Live Share, optimized completely for browser-based programming.

---

## ✨ Key Features

- 🔄 **Real-Time Synchronization:** Low-latency code updates across clients using Socket.io.
- 📁 **Virtual File System:** Create, delete, and switch files (`index.js`, `script.py`) within insulated room sessions.
- 🖱️ **Live Remote Cursors:** Color-coded markers tracking peer cursor positions with username labels.
- 💬 **Integrated Room Chat:** In-app sidebar chat allowing teams to communicate seamlessly.
- ⌨️ **Typing Indicators:** Real-time visibility on who is actively typing to prevent edit collisions.
- 📝 **Monaco Editor Engine:** Rich syntax highlighting and auto-indentation driven by the core engine powering VS Code.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), `@monaco-editor/react`, Vanilla CSS
- **Backend:** Node.js, Express
- **Real-time Engine:** Socket.io (WebSockets)
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Utilities:** Lodash (Debouncing/Throttling for performance optimization)

---

## 📢 SSoC Season 5: Project Admin Announcement!

Welcome SSoC contributors! 🎉 **SyncCode Collaborative** is an active project for Season 5. 

### 🛑 Current Project Status: Undeployed (High Priority)
The local codebase is fully stable and feature-complete, but **the project is currently not deployed**. Setting up cloud hosting, managing environment variables, and establishing production builds is our **top milestone** for the start of the coding phase.

### 🗺️ Contributor Roadmap & Open Tracks
We are looking for contributions across these major domains:
1. **DevOps & Deployment (Urgent):** Containerizing with Docker, configuring production workflows, and deploying to platforms like Render, Railway, Vercel, or AWS.
2. **Feature Expansion:** Implementing sandboxed "Run Code/Code Execution" runtimes, adding file/folder nesting profiles, and implementing GitHub OAuth login.
3. **UI/UX Refinement:** Developing theme selectors (Light/Dark mode), customized code templates, and responsive layouts.
4. **Performance:** Hardening WebSocket events and optimizing Mongoose buffer connections during multi-user spikes.

---

## 💻 Getting Started (Local Development)

Follow these steps to spin up the project on your local machine.

### Prerequisites
- Node.js installed (v18+)
- A MongoDB Atlas Cluster URL

### 1. Clone the Repository
```bash
git clone [https://github.com/Namitanaik07/collaborative-editor.git](https://github.com/Namitanaik07/collaborative-editor.git)
cd collaborative-editor


### 2. Backend Setup
```bash
cd server
npm install


Create a .env file inside the server/ directory and add your variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string


Start the backend server:
```bash
npm start

### 3. Frontend Setup
Open a new terminal window, navigate back to the root, then go to the client folder:
```bash
cd client
npm install
npm run dev


Open http://localhost:5173 in your browser.
## 🤝 Contribution Guidelines
We love your Pull Requests! To maintain code quality:
 1. Check the **Issues** tab for unassigned SSoC labels. Comment to get them assigned.
 2. Create a new branch for your features: git checkout -b feature/your-feature-name.
 3. Commit with descriptive messages and push changes.
 4. Open a Pull Request pointing to the main branch. Ensure you describe your changes clearly!
## 📜 Code of Conduct
This project follows the official Social Summer of Code guidelines. Be respectful, supportive, and open to constructive feedback.
Made with ❤️ by Namita Naik and the SSoC Team.
```

```
