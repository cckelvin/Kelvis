import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Kelvis AI PWA ServiceWorker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('PWA ServiceWorker registration notice:', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Also register in dev mode to test installability
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

