import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Edit3,
  Star,
  PawPrint,
  Heart,
  Users,
  Settings,
  Phone,
  Mail,
} from 'lucide-react';
import { usersApi, listingsApi } from '../api/client';
import type { User, Listing } from '../types';
import { LISTING_TYPE_LABELS, PET_TYPE_IMAGES, PET_TYPE_LABELS } from '../types';
import { STORAGE_KEYS, formatUkrDate, loadStoredStringArray } from '../lib/appUtils';

function ListingCard({
  listing,
  badgeLabel,
  badgeClassName,
  isOwner = false,
}: {
  listing: Listing;
  badgeLabel: string;
  badgeClassName: string;
  isOwner?: boolean;
}) {
  const navigate = useNavigate();

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/edit/${listing.id}`);
  };

  return (
    <div className="relative group">
      <Link
        to={`/listing/${listing.id}`}
        className="block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        <div className="aspect-[4/3] bg-orange-50 overflow-hidden relative">
          <img
            src={(listing.imageUrls && listing.imageUrls.length > 0) ? listing.imageUrls[0] : (PET_TYPE_IMAGES[listing.petType] || PET_TYPE_IMAGES.OTHER)}
            alt={listing.petName || 'Тваринка'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {isOwner && (
            <button
              onClick={handleEditClick}
              className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-md rounded-xl text-primary shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white z-10"
              title="Редагувати"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white ${listing.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
              {LISTING_TYPE_LABELS[listing.type]}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeClassName}`}>
              {badgeLabel}
            </span>
          </div>
          <h3 className="font-bold text-text-dark">{listing.petName || 'Без імені'}</h3>
          <p className="text-text-muted text-sm">{listing.addressText || listing.city || 'Локація не вказана'}</p>
          <p className="text-[11px] text-text-muted font-medium">
            {PET_TYPE_LABELS[listing.petType]} · {formatUkrDate(listing.createdAt, { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [helpedListings, setHelpedListings] = useState<Listing[]>([]);
  const [tab, setTab] = useState<'listings' | 'helped' | 'saved' | 'archive'>('listings');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', city: '', username: '', phoneNumber: '', email: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, myListingsRes] = await Promise.all([
          usersApi.getMe(),
          listingsApi.getMyListings(),
        ]);

        setUser(userRes.data);
        setEditForm({
          displayName: userRes.data.displayName || '',
          bio: userRes.data.bio || '',
          city: userRes.data.city || '',
          username: userRes.data.username || '',
          phoneNumber: userRes.data.phoneNumber || '',
          email: userRes.data.email || '',
          newPassword: '',
        });
        setMyListings(myListingsRes.data);

        const savedIds = loadStoredStringArray(STORAGE_KEYS.savedListings);
        const helpedIds = loadStoredStringArray(STORAGE_KEYS.helpedListings);

        const [savedResults, helpedResults] = await Promise.all([
          savedIds.length > 0
            ? Promise.all(savedIds.map(id => listingsApi.getById(id).then(r => r.data).catch(() => null)))
            : Promise.resolve([]),
          helpedIds.length > 0
            ? Promise.all(helpedIds.map(id => listingsApi.getById(id).then(r => r.data).catch(() => null)))
            : Promise.resolve([]),
        ]);

        setSavedListings(savedResults.filter((l): l is Listing => l !== null));
        setHelpedListings(helpedResults.filter((l): l is Listing => l !== null));
      } catch {
        // not authenticated — show empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await usersApi.updateMe(editForm);
      setUser(prev => ({ ...(prev || {}), ...res.data, bio: editForm.bio, phoneNumber: editForm.phoneNumber }));
      setEditForm(prev => ({ ...prev, newPassword: '' }));
      setEditing(false);
    } catch {
      setSaveError('Не вдалося зберегти зміни. Спробуйте ще раз.');
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter = user?.displayName?.[0]?.toUpperCase() || '?';

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-bg-cream min-h-screen">
        <div className="bg-white rounded-3xl h-48 animate-pulse" />
        <div className="bg-white rounded-3xl h-32 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 md:p-8 bg-bg-cream min-h-screen flex flex-col items-center justify-center text-center">
        <PawPrint className="w-16 h-16 text-primary/30 mb-4" />
        <h2 className="text-2xl font-bold text-text-dark mb-2">Увійдіть до акаунту</h2>
        <p className="text-text-muted mb-6">Щоб переглянути профіль, потрібно авторизуватися</p>
        <Link to="/login" className="btn-primary px-8 rounded-2xl shadow-md">Увійти</Link>
      </div>
    );
  }

  const renderEmptyState = (emoji: string, title: string, description: string, actionText: string, actionTo: string) => (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-xl font-bold text-text-dark mb-2">{title}</h3>
      <p className="text-text-muted mb-6">{description}</p>
      <Link to={actionTo} className="btn-primary px-8 rounded-2xl shadow-md">{actionText}</Link>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-bg-cream min-h-screen">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-text-dark">Профіль</h1>
        <button
          type="button"
          onClick={() => setEditing(previous => !previous)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl font-bold text-text-dark hover:bg-gray-50 transition-all text-sm w-fit"
        >
          <Settings className="w-4 h-4" />
          Налаштування
        </button>
      </header>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-28 md:h-32 bg-gradient-to-br from-orange-100 to-amber-50" />

        <div className="px-4 md:px-8 pb-6 md:pb-8 -mt-12">
          <div className="flex items-end justify-between gap-4">
            <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white shrink-0">
              {avatarLetter}
            </div>
            <button
              type="button"
              onClick={() => setEditing(previous => !previous)}
              className="mb-2 flex items-center gap-2 px-4 py-2 bg-bg-cream border border-gray-100 rounded-xl font-bold text-text-dark hover:bg-white transition-all text-sm"
            >
              <Edit3 className="w-4 h-4" />
              Редагувати
            </button>
          </div>

          {editing ? (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { field: 'displayName', label: "Ім'я", placeholder: 'Олена Коваль' },
                  { field: 'username', label: 'Нікнейм', placeholder: 'nikname' },
                  { field: 'email', label: 'Email', placeholder: 'email@example.com' },
                  { field: 'phoneNumber', label: 'Телефон', placeholder: '+380...' },
                  { field: 'city', label: 'Місто', placeholder: 'Київ' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</label>
                    <input
                      value={editForm[field as keyof typeof editForm]}
                      onChange={e => setEditForm(previous => ({ ...previous, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full py-3 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-dark"
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Новий пароль</label>
                  <input
                    type="password"
                    value={editForm.newPassword}
                    onChange={e => setEditForm(previous => ({ ...previous, newPassword: e.target.value }))}
                    placeholder="Залиште порожнім, щоб не змінювати"
                    className="w-full py-3 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-dark"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Про себе</label>
                  <textarea
                    value={editForm.bio}
                    onChange={e => setEditForm(previous => ({ ...previous, bio: e.target.value }))}
                    placeholder="Розкажіть про себе..."
                    rows={3}
                    className="w-full py-3 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-dark resize-none"
                  />
                </div>
              </div>
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                  {saveError}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary px-6 rounded-xl shadow-md disabled:opacity-50"
                >
                  {saving ? 'Зберігаємо...' : 'Зберегти'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setSaveError(''); }}
                  className="px-6 py-3 bg-white border border-gray-100 rounded-xl font-bold text-text-dark hover:bg-gray-50 transition-all"
                >
                  Скасувати
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-text-dark">{user.displayName || 'Без імені'}</h2>
                {user.isVerifiedDiia && <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50" />}
              </div>
              {user.username && <p className="text-text-muted font-medium">@{user.username}</p>}
              {user.bio && <p className="text-text-muted leading-relaxed max-w-2xl">{user.bio}</p>}
              <div className="flex items-center gap-4 text-sm text-text-muted flex-wrap">
                {user.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> {user.city}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  З {formatUkrDate(user.createdAt, { month: 'long', year: 'numeric' })}
                </span>
                {user.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> {user.email}
                  </span>
                )}
                {user.phoneNumber && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" /> {user.phoneNumber}
                  </span>
                )}
              </div>
              {user.isVerifiedDiia && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Верифіковано через Дію
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: PawPrint, label: 'Оголошень', value: myListings.length },
          { icon: Users, label: 'Допоміг знайти', value: helpedListings.length },
          { icon: Heart, label: 'Збережено', value: savedListings.length },
          { icon: Star, label: 'Рейтинг', value: user.rating?.toFixed(1) ?? '–' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-3xl p-5 md:p-6 border border-gray-100 shadow-sm text-center space-y-2">
            <Icon className="w-6 h-6 text-primary mx-auto" />
            <div className="text-2xl font-bold text-text-dark">{value}</div>
            <div className="text-xs text-text-muted font-bold uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 w-full overflow-x-auto scrollbar-hide">
        {([
          { key: 'listings', label: 'Мої оголошення' },
          { key: 'helped', label: 'Я допомагав' },
          { key: 'saved', label: 'Збережені' },
          { key: 'archive', label: 'Архів' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === key ? 'bg-bg-cream text-text-dark shadow-inner' : 'text-text-muted hover:text-text-dark'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'listings' && (
        myListings.filter(l => l.status !== 'ARCHIVED').length === 0 ? (
          renderEmptyState('📋', 'Ще немає оголошень', 'Створіть перше оголошення про пошук тваринки', 'Додати оголошення', '/add')
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.filter(l => l.status !== 'ARCHIVED').map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isOwner={true}
                badgeLabel={listing.status === 'ACTIVE' ? 'Активне' : listing.status === 'RESOLVED' ? 'Знайдено!' : listing.status}
                badgeClassName={listing.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}
              />
            ))}
          </div>
        )
      )}

      {tab === 'archive' && (
        myListings.filter(l => l.status === 'ARCHIVED').length === 0 ? (
          renderEmptyState('📁', 'Архів порожній', 'Тут будуть ваші заархівовані оголошення.', 'До стрічки', '/')
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.filter(l => l.status === 'ARCHIVED').map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isOwner={true}
                badgeLabel="В архіві"
                badgeClassName="bg-gray-100 text-gray-500"
              />
            ))}
          </div>
        )
      )}

      {tab === 'helped' && (
        helpedListings.length === 0 ? (
          renderEmptyState('🤝', 'Тут будуть ваші допомоги', 'Після того як ви залишите свідчення, оголошення зʼявиться тут.', 'Перейти до пошуку', '/search')
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpedListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                badgeLabel="Свідчення додано"
                badgeClassName="bg-purple-50 text-purple-700"
              />
            ))}
          </div>
        )
      )}

      {tab === 'saved' && (
        savedListings.length === 0 ? (
          renderEmptyState('❤️', 'Збережені оголошення', 'Натисніть серце на сторінці оголошення, і воно зʼявиться тут.', 'Перейти до стрічки', '/')
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                badgeLabel="Збережено"
                badgeClassName="bg-red-50 text-red-700"
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
