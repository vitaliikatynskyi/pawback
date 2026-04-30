import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Mail, Lock, User as UserIcon } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const readErrorMessage = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('json')) {
      try {
        const data = await response.json() as { detail?: string; title?: string; message?: string };
        return data.detail || data.message || data.title || 'Помилка авторизації';
      } catch {
        // fall through to text parsing
      }
    }

    const text = await response.text();
    return text || 'Помилка авторизації';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister 
        ? { email, password, displayName } 
        : { email, password };

      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      navigate('/'); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка авторизації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg-cream">
      {/* Left side: Illustration & Stats */}
      <div className="hidden lg:flex w-7/12 flex-col justify-center p-20 relative overflow-hidden bg-gradient-to-br from-bg-cream to-bg-sidebar">
        <div className="max-w-2xl">
          <div className="grid grid-cols-2 gap-4 mb-12">
            <div className="aspect-square bg-[#FEE2E2] rounded-[40px] flex items-center justify-center p-8">
               <img src="https://api.iconify.design/fluent-emoji-flat:cat-face.svg" className="w-full h-full opacity-80" alt="cat" />
            </div>
            <div className="aspect-square bg-[#FFEDD5] rounded-[40px] flex items-center justify-center p-8">
               <img src="https://api.iconify.design/fluent-emoji-flat:dog-face.svg" className="w-full h-full opacity-80" alt="dog" />
            </div>
            <div className="aspect-square bg-[#FEF3C7] rounded-[40px] flex items-center justify-center p-8">
               <img src="https://api.iconify.design/fluent-emoji-flat:hamster-face.svg" className="w-full h-full opacity-80" alt="hamster" />
            </div>
            <div className="aspect-square bg-[#E0F2FE] rounded-[40px] flex items-center justify-center p-8">
               <img src="https://api.iconify.design/fluent-emoji-flat:rabbit-face.svg" className="w-full h-full opacity-80" alt="rabbit" />
            </div>
          </div>

          <h1 className="text-5xl font-serif font-bold text-text-dark mb-6 leading-tight">
            Допоможемо знайти<br />Барсика
          </h1>
          <p className="text-xl text-text-muted mb-12 max-w-lg leading-relaxed">
            За минулий місяць спільнота PawBack повернула додому 1 247 тваринок. Кожен погляд має значення.
          </p>

          <div className="flex gap-16">
            <div>
              <div className="text-2xl font-bold text-text-dark">1 247</div>
              <div className="text-sm text-text-muted mt-1">знайдено</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-dark">38 тис.</div>
              <div className="text-sm text-text-muted mt-1">користувачів</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-dark">7 міст</div>
              <div className="text-sm text-text-muted mt-1">в Україні</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="w-full lg:w-5/12 bg-white flex items-center justify-center p-8 shadow-2xl z-10">
        <div className="max-w-md w-full">
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-8 bg-bg-cream px-4 py-2 rounded-full lg:-ml-4">
               <div className="bg-primary p-1.5 rounded-lg">
                 <PawPrint className="w-5 h-5 text-white" />
               </div>
               <span className="font-bold text-text-dark">PawBack</span>
            </div>
            <h2 className="text-3xl font-bold text-text-dark mb-3">
              {isRegister ? 'Реєстрація' : 'Вхід або реєстрація'}
            </h2>
            <p className="text-text-muted">Допоможіть тваринці повернутися додому</p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              { label: 'Google', icon: 'https://www.svgrepo.com/show/475656/google-color.svg' },
              { label: 'Apple', icon: 'https://www.svgrepo.com/show/511330/apple-173.svg' },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="w-full flex items-center justify-between gap-3 py-3 px-4 border border-gray-100 rounded-2xl bg-gray-50/60 opacity-60 cursor-not-allowed select-none"
                aria-disabled="true"
              >
                <div className="flex items-center gap-3">
                  <img src={icon} className="w-5 h-5" alt={label} />
                  <span className="font-medium text-text-dark">Продовжити через {label}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted bg-gray-200 px-2 py-0.5 rounded-full">Незабаром</span>
              </div>
            ))}
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="px-4 bg-white text-text-muted">або через email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            {isRegister && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Ім'я</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                    placeholder="Ваше ім'я"
                    required={isRegister}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                  placeholder="ви@приклад.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? 'Завантаження...' : (isRegister ? 'Створити акаунт' : 'Увійти')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              className="text-text-muted hover:text-primary font-bold text-sm transition-colors"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Вже маєте акаунт? Увійдіть' : 'Ще немає акаунту? Зареєструватися'}
            </button>
          </div>

          <div className="mt-12 space-y-3 pt-8 border-t border-gray-50 text-[11px] text-text-muted font-medium uppercase tracking-widest text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
               Контакти приховано — спілкування через чат
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-2">
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
               Верифікація через Дію — без фейків
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




/**
 * Task: feat: add form validation and error feedback for login page
 * Implemented during Pull Request #8
 * Timestamp: 2026-03-13T22:00:00
 */
