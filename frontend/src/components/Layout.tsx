import { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  PawPrint,
  LayoutGrid,
  Search,
  Map as MapIcon,
  Plus,
  Bell,
  MessageSquare,
  User,
  LogOut,
  LogIn
} from 'lucide-react';
import { api } from '../api/client';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const createPath = token ? '/add' : '/login';

  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await api.get('/api/notifications/unread-count');
      setUnreadNotifs(res.data.count || 0);
    } catch (err) {
      // silent fail
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-bg-cream overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex-shrink-0 flex items-center justify-between p-4 bg-bg-sidebar/95 backdrop-blur-md border-b border-gray-200/50 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-xl">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-text-dark">PawBack</span>
        </div>
        <button
          type="button"
          onClick={() => navigate(createPath)}
          className="bg-primary hover:bg-primary-hover p-2 rounded-xl text-white shadow-md transition-colors"
          aria-label="Створити оголошення"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-bg-sidebar flex-col border-r border-gray-200/50 h-full p-6 flex-shrink-0 z-40">
        <div className="flex-shrink-0 flex items-center gap-3 mb-10 px-2">
          <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-orange-200">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-dark leading-none">PawBack</h1>
            <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-medium">допоможемо знайти</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 scrollbar-hide">
          <NavLink to="/" end className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <LayoutGrid className="w-5 h-5" />
            <span className="font-medium">Стрічка</span>
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Search className="w-5 h-5" />
            <span className="font-medium">Пошук</span>
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <MapIcon className="w-5 h-5" />
            <span className="font-medium">Карта</span>
          </NavLink>

          <div className="pt-4 pb-2">
            <button
              type="button"
              onClick={() => navigate(createPath)}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>ДОДАТИ</span>
            </button>
          </div>

          <NavLink to="/notifications" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} relative`}>
            <Bell className="w-5 h-5" />
            <span className="font-medium">Сповіщення</span>
            {unreadNotifs > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadNotifs}
              </span>
            )}
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Повідомлення</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <User className="w-5 h-5" />
            <span className="font-medium">Профіль</span>
          </NavLink>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-200/50 flex-shrink-0">
          {token ? (
            <button
              onClick={handleLogout}
              className="sidebar-item w-full text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Вийти</span>
            </button>
          ) : (
            <NavLink to="/login" className="sidebar-item">
              <LogIn className="w-5 h-5" />
              <span className="font-medium">Вхід</span>
            </NavLink>
          )}
          <p className="text-[10px] text-text-muted mt-4 px-2">© 2026 PawBack</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto pb-20 md:pb-0 scroll-smooth">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-2 flex items-center justify-around z-50"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        {[
          { to: '/', end: true, icon: LayoutGrid, label: 'Стрічка' },
          { to: '/search', icon: Search, label: 'Пошук' },
          { to: '/map', icon: MapIcon, label: 'Карта' },
          { to: '/notifications', icon: Bell, label: 'Сповіщення' },
          { to: '/messages', icon: MessageSquare, label: 'Чати' },
          { to: '/profile', icon: User, label: 'Профіль' },
        ].map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-text-muted'} relative`
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-bold">{label}</span>
            {to === '/notifications' && unreadNotifs > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">
                {unreadNotifs}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
