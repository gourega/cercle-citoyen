import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Suppression du loader initial dès que le script s'exécute
const loader = document.getElementById('initial-loader');
if (loader) loader.remove();

const container = document.getElementById('root');

if (!container) {
  console.error("Erreur fatale : Élément #root introuvable.");
} else {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Cercle Citoyen : Système V4 prêt.");
  } catch (err) {
    console.error("Erreur de rendu React :", err);
    document.body.innerHTML = `<div style="color:white; padding:40px; text-align:center;">
      <h1 style="color:red">Erreur d'Application</h1>
      <pre style="text-align:left; background:#111; padding:20px; border-radius:10px; margin-top:20px;">${err}</pre>
    </div>`;
  }
}