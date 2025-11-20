// client/src/App.jsx (Revised)
import React, { useState } from 'react';
import useSocket from './hooks/useSocket'; 
import CodeEditor from './components/Editor'; // Import the new Editor component
import './App.css'; 

const initialCode = `function hello() {
// Start coding here!
console.log("Welcome to the collaborative editor.");
}`;

function App() {
  // Socket connection is established, but we won't use 'socket' until tomorrow.
  const { isConnected } = useSocket(); 

  // 1. Local state to hold the code content
  const [code, setCode] = useState(initialCode);
  // 2. Local state for the selected language
  const [language, setLanguage] = useState('javascript'); 

  // 3. Handler for when code changes in the editor
  const handleCodeChange = (newCode) => {
      setCode(newCode);
      console.log("Local code updated:", newCode.substring(0, 50) + '...');

      // Day 5: This is where we will emit the changes via socket!
  };

  return (
    <div className="App" style={{ padding: '20px' }}>
      <header>
        <h1>Collaborative Code Editor</h1>
        <p>
          Status: **{isConnected ? '🟢 Connected' : '🔴 Disconnected'}** | Language: **{language}**
        </p>
      </header>

      {/* Render the Code Editor Component */}
      <CodeEditor 
        code={code}
        language={language}
        onChange={handleCodeChange}
      />

      <p style={{ marginTop: '20px' }}>
        <small>Current Code Length: {code.length}</small>
      </p>
    </div>
  );
}

export default App;