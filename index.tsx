import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const container = document.getElementById('root');

if (!container) {
  throw new Error("L'élément racine #root est introuvable dans le DOM.");
}

const root = createRoot(container);
root.render(<App />);