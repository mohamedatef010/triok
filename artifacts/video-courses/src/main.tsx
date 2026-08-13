import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

// Intercept media loading errors globally so Vite's runtime error overlay ignores them
window.addEventListener('error', (e) => {
  if (e.target instanceof HTMLSourceElement || e.target instanceof HTMLVideoElement || e.target instanceof HTMLAudioElement) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
  if (e.message && e.message.includes('Failed to load because no supported source was found')) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, true);
createRoot(document.getElementById('root')!).render(<App />);
