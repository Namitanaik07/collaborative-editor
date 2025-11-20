// client/src/main.jsx (Vite Entry Point)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // We'll redefine App.jsx as the router holder
import './index.css';

// The router must wrap the entire application
import { BrowserRouter } from 'react-router-dom'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);