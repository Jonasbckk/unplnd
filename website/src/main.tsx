import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import './styles.css';
import App from './App';

// Cookieless, aggregated page analytics (documented in the privacy policy).
if (import.meta.env.PROD) inject();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
