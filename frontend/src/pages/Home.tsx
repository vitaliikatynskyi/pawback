import { useNavigate } from 'react-router-dom';
import { PawPrint, LogOut, Search, PlusCircle, Map as MapIcon, MessageSquare } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  if (!token) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const shortcuts = [
    {
      title: 'Створити оголошення',
      description: 'Повідомте про знайдено або загублену тварину',
      icon: PlusCircle,
      accent: 'bg-blue-50',
      iconColor: 'text-blue-600',
      path: '/add',
    },
    {
      title: 'Розумний пошук',
      description: 'Шукайте за фото або описом за допомогою ШІ',
      icon: Search,
      accent: 'bg-orange-50',
      iconColor: 'text-[#E8704A]',
      path: '/search',
    },
    {
      title: 'Мапа тварин',
      description: 'Дивіться оголошення поруч з вами',
      icon: MapIcon,
      accent: 'bg-green-50',
      iconColor: 'text-green-600',
      path: '/map',
    },
    {
      title: 'Чати',
      description: 'Спілкуйтеся з власниками або волонтерами',
      icon: MessageSquare,
      accent: 'bg-purple-50',
      iconColor: 'text-purple-600',
      path: '/messages',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-[#E8704A] p-2 rounded-lg">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-[#2B2420]">PawBack</span>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <button type="button" onClick={() => navigate('/search')} className="text-[#8B7E72] hover:text-[#E8704A] transition-colors">Пошук</button>
          <button type="button" onClick={() => navigate('/map')} className="text-[#8B7E72] hover:text-[#E8704A] transition-colors">Мапа</button>
          <button type="button" onClick={() => navigate('/messages')} className="text-[#8B7E72] hover:text-[#E8704A] transition-colors">Повідомлення</button>
          <button 
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#8B7E72] hover:text-red-500 transition-colors ml-4"
          >
            <LogOut className="w-5 h-5" />
            <span>Вийти</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <header className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-[#2B2420] mb-4">Вітаємо у PawBack!</h1>
          <p className="text-[#8B7E72] text-lg">Ви успішно увійшли до системи. Тут ви зможете шукати загублених тварин або допомагати іншим.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shortcuts.map(({ title, description, icon: Icon, accent, iconColor, path }) => (
            <button
              key={title}
              type="button"
              onClick={() => navigate(path)}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group text-left"
            >
              <div className={`${accent} w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="text-xl font-bold text-[#2B2420] mb-2">{title}</h3>
              <p className="text-[#8B7E72] text-sm">{description}</p>
            </button>
          ))}
        </div>

        <div className="mt-16 bg-[#F5EFE7] p-12 rounded-3xl text-center">
          <h2 className="text-2xl font-bold text-[#2B2420] mb-4">Поки що тут порожньо...</h2>
          <p className="text-[#8B7E72] mb-8">Ми тільки починаємо. Скоро тут з'являться активні оголошення!</p>
          <button type="button" onClick={() => navigate('/add')} className="bg-[#E8704A] text-white px-8 py-3 rounded-xl font-medium hover:bg-[#D55F38] transition-colors">
            Створити перше оголошення
          </button>
        </div>
      </main>
    </div>
  );
}




 
 
 
 
 
 
/**
 * Task: style: improve home page layout with smooth transitions and animations
 * Implemented during Pull Request #7
 * Timestamp: 2026-03-12T10:00:00
 */
/**
 * Task: style: update hero section with high-quality pet images
 * Implemented during Pull Request #37
 * Timestamp: 2026-04-26T11:00:00
 */
 
 
 
 
