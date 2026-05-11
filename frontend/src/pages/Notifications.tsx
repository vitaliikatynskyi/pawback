import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../api/client';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  link?: string;
}

const ICONS: Record<string, any> = {
  COMMENT: { icon: MessageCircle, bg: 'bg-blue-100', color: 'text-blue-600' },
  MESSAGE: { icon: MessageCircle, bg: 'bg-green-100', color: 'text-green-600' },
  MATCH: { icon: MapPin, bg: 'bg-orange-100', color: 'text-orange-600' },
  STATUS_CHANGE: { icon: CheckCircle2, bg: 'bg-purple-100', color: 'text-purple-600' },
  DEFAULT: { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-600' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError('Не вдалося завантажити сповіщення');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      // ignore
    }
  };

  const openNotification = async (notification: NotificationItem) => {
    if (!notification.read) {
      try {
        await api.post(`/api/notifications/${notification.id}/read`);
        setNotifications(prev => prev.map(item => (
          item.id === notification.id ? { ...item, read: true } : item
        )));
      } catch (err) {
        // ignore
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Завантаження сповіщень...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-bg-cream min-h-screen">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-text-dark mb-2">Сповіщення</h1>
          <p className="text-text-muted">
            {unreadCount > 0 ? `${unreadCount} непрочитаних` : 'Усі прочитано'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-sm font-bold text-primary hover:underline text-left sm:text-right"
          >
            Позначити всі прочитаними
          </button>
        )}
      </header>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <Bell className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
            <p className="text-text-muted font-medium">У вас поки немає сповіщень</p>
          </div>
        ) : (
          notifications.map(notification => {
            const config = ICONS[notification.type] || ICONS.DEFAULT;
            const Icon = config.icon;
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
                className={`w-full flex items-start gap-4 p-5 rounded-2xl border transition-all text-left hover:shadow-md ${
                  notification.read 
                    ? 'bg-white border-gray-100' 
                    : 'bg-orange-50/60 border-orange-100 shadow-sm'
                }`}
              >
                <div className={`w-12 h-12 ${config.bg} ${config.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-text-dark">{notification.title}</h3>
                    <span className="text-xs text-text-muted font-medium whitespace-nowrap flex-shrink-0">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm mt-1 leading-relaxed">
                    {notification.body}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                )}
              </button>
            );
          })
        )}
      </div>

      {notifications.length > 0 && (
        <div className="text-center py-8">
          <Bell className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted text-sm font-medium">Більше сповіщень поки немає</p>
        </div>
      )}
    </div>
  );
}




 
 
 
 
