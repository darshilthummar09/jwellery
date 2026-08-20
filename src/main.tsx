import { createRoot } from 'react-dom/client';
import { AppRouter } from './routes/AppRouter';
import { registerSW } from 'virtual:pwa-register';

// Immediately activate and reload on a new deployment instead of silently
// serving a stale cached bundle to an already-open tab.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
});
import './styles/index.css';

createRoot(document.getElementById('root')!).render(<AppRouter />);