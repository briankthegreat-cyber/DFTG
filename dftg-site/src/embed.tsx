// Standalone entry: the explainer alone, configured from the URL (?theme=light&chapter=uc ...).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { readOptions } from '@/ibd/config.ts';
import { Explainer } from '@/explainer/Explainer.tsx';

document.documentElement.style.height = '100%';
document.body.style.height = '100%';
document.body.style.overflow = 'hidden';
const root = document.getElementById('root')!;
root.style.height = '100%';

createRoot(root).render(
  <StrictMode>
    <Explainer options={readOptions(window.location.search)} />
  </StrictMode>,
);
