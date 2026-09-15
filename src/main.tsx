// jb7572_2026-08-24: React Application Entry Point
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// jb7572_2026-08-24: Mount React Application into DOM root container
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

