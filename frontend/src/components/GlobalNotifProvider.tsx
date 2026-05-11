import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { MessageCircle, Bell, X, Search } from 'lucide-react';
import { decodeJwtPayload } from '../lib/appUtils';

interface Toast {
  id: number;
  type: 'message' | 'notification' | 'listing';
  title: string;
  content: string;
  link: string;
  iconType?: string;
}

interface GlobalNotifContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
}

const GlobalNotifContext = createContext<GlobalNotifContextValue>({ addToast: () => {} });
export const useGlobalNotif = () => useContext(GlobalNotifContext);

let toastCounter = 0;

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    if (toast.type === 'message') return <MessageCircle className="w-5 h-5 text-green-600" />;
    if (toast.type === 'listing') return <Search className="w-5 h-5 text-orange-600" />;
    return <Bell className="w-5 h-5 text-blue-600" />;
  };

  const getBg = () => {
    if (toast.type === 'message') return 'bg-green-50 border-green-100';
    if (toast.type === 'listing') return 'bg-orange-50 border-orange-100';
    return 'bg-blue-50 border-blue-100';
  };

  return (
    <div
      className={`chat-toast shadow-xl ${getBg()}`}
      onClick={() => {
        navigate(toast.link);
        onClose();
      }}
    >
      <div className="chat-toast-icon">
        {getIcon()}
      </div>
      <div className="chat-toast-body">
        <div className="chat-toast-name">{toast.title}</div>
        <div className="chat-toast-text">{toast.content}</div>
      </div>
      <button
        className="chat-toast-close"
        onClick={e => { e.stopPropagation(); onClose(); }}
        aria-label="Закрити"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function GlobalNotifProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const stompRef = useRef<Client | null>(null);
  const currentPathRef = useRef(window.location.pathname + window.location.search);

  useEffect(() => {
    const onNav = () => {
      currentPathRef.current = window.location.pathname + window.location.search;
    };
    window.addEventListener('popstate', onNav);
    return () => window.removeEventListener('popstate', onNav);
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = ++toastCounter;
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const jwtPayload = decodeJwtPayload(token);
    const currentUserEmail = jwtPayload?.sub || jwtPayload?.email || '';

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 10000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      onConnect: () => {
        // 1. Personal messages (Chat)
        client.subscribe('/user/queue/messages', (frame) => {
          const msg = JSON.parse(frame.body);
          if (msg.sender?.email === currentUserEmail) return;
          
          const currentPath = currentPathRef.current;
          if (currentPath.includes('/messages') && currentPath.includes(msg.sender?.id)) return;

          addToast({
            type: 'message',
            title: msg.sender?.displayName || 'Нове повідомлення',
            content: msg.content || 'Повідомлення',
            link: `/messages?userId=${msg.sender?.id}&name=${encodeURIComponent(msg.sender?.displayName || 'Користувач')}`
          });
        });

        // 2. Personal notifications (Comments, etc.)
        client.subscribe('/user/queue/notifications', (frame) => {
          const notif = JSON.parse(frame.body);
          if (window.location.pathname === '/notifications') return;

          addToast({
            type: 'notification',
            title: notif.title,
            content: notif.body,
            link: notif.link || '/notifications'
          });
        });

        // 3. Global listing alerts
        client.subscribe('/topic/listings', (frame) => {
          const listing = JSON.parse(frame.body);
          // Don't toast if we are already on the feed or just created it
          if (window.location.pathname === '/') return;

          const typeLabel = listing.type === 'LOST' ? 'Загублено' : 'Знайдено';
          addToast({
            type: 'listing',
            title: `Нове оголошення: ${typeLabel}`,
            content: `${listing.petName} (${listing.petType}) у м. ${listing.city}`,
            link: `/listing/${listing.id}`
          });
        });
      },
    });

    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); };
  }, [addToast]);

  return (
    <GlobalNotifContext.Provider value={{ addToast }}>
      {children}
      <div className="chat-toast-container">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </GlobalNotifContext.Provider>
  );
}
