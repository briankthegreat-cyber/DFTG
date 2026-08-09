import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@anatomy/ui/styles.css';
import './styles.css';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
