import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Note: intentionally not wrapped in <StrictMode> - StrictMode
// double-invokes effects in development, which would double-emit the
// join_room socket event and briefly create two participant entries
// for the same user. The app is otherwise written defensively
// (handlers clean up after themselves), but this avoids a confusing
// dev-only symptom for a project centered on real-time state.
createRoot(document.getElementById('root')).render(<App />);
