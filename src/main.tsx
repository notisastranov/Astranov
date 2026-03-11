/**
 * Astranov Frontend Entry Point
 * 
 * Authorship: Astranov
 * System Design: Spartan Script
 * Founder: Notis Astranov
 * Year: 2026
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
