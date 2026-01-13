import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Forçage visuel immédiat pour éviter le flash blanc ou vert
document.body.style.backgroundColor = '#0a0c10';

const container = document.getElementById('root');
if (!container) {
  const rootDiv = document.createElement('div');
  rootDiv.id = 'root';
  document.body.appendChild(rootDiv);
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);