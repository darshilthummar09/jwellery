import { createRoot } from 'react-dom/client';
import { AppRouter } from './routes/AppRouter';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
import './styles/index.css';

createRoot(document.getElementById('root')!).render(<AppRouter />);