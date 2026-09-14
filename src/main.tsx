import { createRoot } from 'react-dom/client';
import { AppRouter } from './routes/AppRouter';
import { registerSW } from 'virtual:pwa-register';
import { healStaleServiceWorkerScope } from './services/notificationService';

// Unregister any pre-fix firebase-messaging-sw.js still registered at scope
// '/' — left in place it fights the PWA service worker below for control of
// the page and causes a reload loop (see healStaleServiceWorkerScope).
healStaleServiceWorkerScope();

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
});
import './styles/index.css';

createRoot(document.getElementById('root')!).render(<AppRouter />);