import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface SocketNotification {
  type: string;
  data: {
    name: string;
    user: string;
    timestamp: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  };
}

interface SocketContextType {
  socket: Socket | null;
  notifications: SocketNotification[];
  unreadCount: number;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

const NOTIFICATION_MESSAGES: Record<string, string> = {
  inventory_created: 'Yeni cihaz eklendi',
  inventory_updated: 'Cihaz güncellendi',
  inventory_deleted: 'Cihaz silindi',
  project_created: 'Yeni proje oluşturuldu',
  project_deleted: 'Proje silindi',
  site_created: 'Yeni site eklendi',
  site_deleted: 'Site silindi',
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<SocketNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const token = localStorage.getItem('accessToken');

    // ── FIXED: send auth token for socket authentication ──
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket auth failed:', err.message);
    });

    newSocket.on('notification', (notification: SocketNotification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);

      const msg = NOTIFICATION_MESSAGES[notification.type] || notification.type;
      toast(
        `${msg}: ${notification.data.name}`,
        { icon: '🔔', duration: 4000 },
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const clearNotifications = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
