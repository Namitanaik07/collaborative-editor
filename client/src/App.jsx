// client/src/App.jsx (New Routing Component)
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import CodeEditorPage from './components/CodeEditorPage'; // We will create this component next

function App() {
  return (
    <Routes>
      {/* Home Page: Join or Create Room */}
      <Route path="/" element={<Home />} />

      {/* Editor Room: The main collaboration page, uses a dynamic room ID */}
      <Route path="/room/:roomId" element={<CodeEditorPage />} />
    </Routes>
  );
}

export default App;