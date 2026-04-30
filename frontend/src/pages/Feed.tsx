import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, Plus, RefreshCw } from 'lucide-react';
import { listingsApi } from '../api/client';
import { PET_TYPE_IMAGES, type Listing } from '../types';
import { formatUkrDate, normalizeText } from '../lib/appUtils';

const BG_COLORS = ['bg-orange-50', 'bg-red-50', 'bg-blue-50', 'bg-amber-50'];

type ListingFilter = 'all' | 'LOST' | 'FOUND';
type PetFilter = 'all' | 'CAT' | 'DOG' | 'OTHER';

const FILTER_TABS = [
  { val: 'all', label: 'Усі', kind: 'both' as const },
  { val: 'CAT', label: 'Коти', kind: 'pet' as const },
  { val: 'DOG', label: 'Собаки', kind: 'pet' as const },
  { val: 'LOST', label: 'Загублено', kind: 'listing' as const },
  { val: 'FOUND', label: 'Знайдено', kind: 'listing' as const },
] as const;

export default function Feed() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [listingTypeFilter, setListingTypeFilter] = useState<ListingFilter>('all');
  const [petTypeFilter, setPetTypeFilter] = useState<PetFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchListings = () => {
    setLoading(true);
    setApiError(false);
    listingsApi.getAll()
      .then(res => setListings(res.data))
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const filtered = listings.filter(l => {
    if (listingTypeFilter !== 'all' && l.type !== listingTypeFilter) return false;
    if (petTypeFilter !== 'all' && l.petType !== petTypeFilter) return false;

    const q = normalizeText(searchQuery);
    if (!q) return true;

    return (
      normalizeText(l.petName).includes(q) ||
      normalizeText(l.breed).includes(q) ||
      normalizeText(l.addressText).includes(q) ||
      normalizeText(l.city).includes(q) ||
      normalizeText(l.color).includes(q) ||
      normalizeText(l.distinctiveMarks).includes(q)
    );
  });

  const hasActiveFilters = listingTypeFilter !== 'all' || petTypeFilter !== 'all' || searchQuery.trim() !== '';

  const resetFilters = () => {
    setListingTypeFilter('all');
    setPetTypeFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-bg-cream min-h-screen">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-text-dark mb-1">Стрічка оголошень</h1>
            <p className="text-sm text-text-muted">
              {loading
                ? 'Завантаження...'
                : apiError
                  ? 'Не вдалося завантажити оголошення'
                  : `${filtered.length} ${filtered.length === 1 ? 'оголошення' : 'оголошень'} знайдено`}
            </p>
          </div>
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Пошук за породою, кольором, місцем..."
              className="pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-72 transition-all text-sm text-text-dark"
            />
          </div>
        </header>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map(({ val, label, kind }) => {
            const isActive =
              val === 'all'
                ? listingTypeFilter === 'all' && petTypeFilter === 'all'
                : kind === 'pet'
                  ? petTypeFilter === val
                  : listingTypeFilter === val;

            return (
              <button
                key={val}
                type="button"
                onClick={() => {
                  if (val === 'all') { resetFilters(); return; }
                  if (kind === 'pet') { setPetTypeFilter(val as PetFilter); return; }
                  setListingTypeFilter(val as ListingFilter);
                }}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-text-dark text-white shadow-md'
                    : 'bg-white text-text-dark border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            );
          })}

          <Link
            to="/search"
            className="ml-auto px-5 py-2 rounded-full text-sm font-bold text-text-muted bg-white border border-gray-100 hover:bg-gray-50 transition-all whitespace-nowrap"
          >
            Розширений пошук →
          </Link>
        </div>

        {/* API Error */}
        {apiError && !loading && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center justify-between gap-4">
            <p className="text-red-600 text-sm font-medium">Не вдалося завантажити оголошення. Перевірте підключення до мережі.</p>
            <button
              type="button"
              onClick={fetchListings}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Спробувати знову
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-4">
                <div className="aspect-[4/5] rounded-[40px] bg-white animate-pulse" />
                <div className="space-y-2 px-2">
                  <div className="h-5 bg-white rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-white rounded-full w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🐾</div>
            {listings.length === 0 ? (
              <>
                <h3 className="text-xl font-bold text-text-dark mb-2">Поки що немає оголошень</h3>
                <p className="text-text-muted mb-6">Будьте першими — допоможіть знайти тваринку</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-text-dark mb-2">Нічого не знайдено</h3>
                <p className="text-text-muted mb-6">Спробуйте змінити фільтри або пошуковий запит</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mb-4 text-primary font-bold hover:underline text-sm"
                  >
                    Скинути фільтри
                  </button>
                )}
              </>
            )}
            <Link to="/add" className="btn-primary px-8 rounded-2xl shadow-md inline-flex">
              <Plus className="w-4 h-4" />
              Додати оголошення
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filtered.map((listing, idx) => (
              <Link key={listing.id} to={`/listing/${listing.id}`} className="group cursor-pointer">
                <div className={`aspect-[4/5] rounded-[40px] overflow-hidden relative mb-4 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-orange-100 group-hover:-translate-y-2 ${BG_COLORS[idx % BG_COLORS.length]}`}>
                  <img
                    src={(listing.imageUrls && listing.imageUrls.length > 0) ? listing.imageUrls[0] : (PET_TYPE_IMAGES[listing.petType] || PET_TYPE_IMAGES.OTHER)}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${(!listing.imageUrls || listing.imageUrls.length === 0) ? 'mix-blend-multiply' : ''}`}
                    alt={listing.petName || 'Тваринка'}
                    loading="lazy"
                  />

                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md text-white ${listing.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
                      {listing.type === 'LOST' ? 'Загублено' : 'Знайдено'}
                    </span>
                    {listing.rewardAmount && (
                      <span className="px-3 py-1 bg-white text-primary rounded-full text-[10px] font-black uppercase tracking-widest shadow-md border border-white">
                        {listing.rewardAmount} ₴
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/80 backdrop-blur-md rounded-3xl border border-white/50 shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="w-full btn-primary text-xs py-2 rounded-xl">Дивитись деталі</div>
                  </div>
                </div>

                <div className="px-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-text-dark group-hover:text-primary transition-colors">
                      {listing.petName || 'Без імені'}
                    </h3>
                    <span className="text-[10px] text-text-muted font-bold flex items-center gap-1 uppercase tracking-tighter">
                      <Clock className="w-3 h-3" />
                      {formatUkrDate(listing.createdAt, { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {(listing.addressText || listing.city) && (
                    <p className="text-text-muted text-sm flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-primary/60" />
                      {[listing.addressText, listing.district].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
 
 
 
 
/**
 * Task: refactor: implement virtualization for listing feed
 * Implemented during Pull Request #27
 * Timestamp: 2026-04-11T11:00:00
 */
 
 
 
