import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { socketService } from '../services/socket';

const SocketContext = createContext(null);

// Connection status is its own small state machine so the UI (header
// dot, reconnect banner) can react to it without every component
// needing to know Socket.IO's event names.
const STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
};

export { STATUS as CONNECTION_STATUS };

export function SocketProvider({ children }) {
  const [status, setStatus] = useState(STATUS.CONNECTING);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = socketService.connect();
    socketRef.current = socket;

    const handleConnect = () => setStatus(STATUS.CONNECTED);
    const handleDisconnect = () => setStatus(STATUS.DISCONNECTED);
    const handleReconnectAttempt = () => setStatus(STATUS.RECONNECTING);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleConnect);

    if (socket.connected) setStatus(STATUS.CONNECTED);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleConnect);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current || socketService.getSocket(), status }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
