import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Alert, SensorReading } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  lastReading: SensorReading | null;
  lastAssessment: any | null;
  notifications: Alert[];
  dismissNotification: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastReading, setLastReading] = useState<SensorReading | null>(null);
  const [lastAssessment, setLastAssessment] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<Alert[]>([]);

  useEffect(() => {
    // Only establish telemetry socket connection if user is authenticated
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to telemetry stream:', s.id);
    });

    s.on('connect_error', (err) => {
      console.warn('[Socket] Connection auth error:', err.message);
      setIsConnected(false);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('reading:new', (reading: SensorReading) => {
      setLastReading(reading);
    });

    s.on('assessment:updated', (assessment: any) => {
      setLastAssessment(assessment);
    });

    s.on('alert:new', (alert: Alert) => {
      setNotifications(prev => [alert, ...prev.slice(0, 4)]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isAuthenticated, token]);


  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        lastReading,
        lastAssessment,
        notifications,
        dismissNotification
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
