import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker } from './pwa-register';

// Wrap fetch globally to always include credentials for API requests
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  let [resource, config] = args;
  config = { credentials: 'include', ...(config || {}) };
  return originalFetch(resource, config);
};

registerServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);
