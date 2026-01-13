import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const mountApp = () => {
    const container = document.getElementById('root');
    const splash = document.getElementById('splash-screen');

    if (container) {
        try {
            const root = createRoot(container);
            root.render(
                <React.StrictMode>
                    <App />
                </React.StrictMode>
            );
            
            // On masque le splash screen en douceur
            if (splash) {
                splash.style.opacity = '0';
                setTimeout(() => splash.remove(), 500);
            }
            console.log("Cercle Citoyen : Système V5.0 OPÉRATIONNEL");
        } catch (err) {
            console.error("Erreur de montage React :", err);
        }
    }
};

mountApp();