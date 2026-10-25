import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Home } from './Home';
import { NOISE } from './data';
import './styles.css';

document.documentElement.style.setProperty('--noise', NOISE);
createRoot(document.getElementById('root')!).render(<StrictMode><Home /></StrictMode>);
