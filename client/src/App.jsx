import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })));
const Room = lazy(() => import('./pages/Room').then((m) => ({ default: m.Room })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

export default function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/room/:roomCode" element={<Room />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgb(var(--color-surface))',
              color: 'rgb(var(--color-ink))',
              border: '1px solid rgb(var(--color-border))',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </SocketProvider>
    </ThemeProvider>
  );
}
