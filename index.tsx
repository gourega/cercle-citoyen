import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Forçage du thème sombre au niveau du document
document.body.style.backgroundColor = '#0a0c10';

const container = document.getElementById('root');
if (!container) throw new Error("Root element not found");

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);