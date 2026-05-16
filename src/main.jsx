// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 1. Tienes que importar esto
import App from './App.jsx';
import './index.css'; // Tu archivo donde configuraste Tailwind v4

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. BrowserRouter DEBE envolver a tu App */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);