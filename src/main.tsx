import { createRoot } from 'react-dom/client';
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-700.css';
import { App } from './app/App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(<App />);
