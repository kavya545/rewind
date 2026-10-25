import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works from any sub-path; the prototype subpages in public/ link back via Home.dc.html.
export default defineConfig({ base: './', plugins: [react()] });
