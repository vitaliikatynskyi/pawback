import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Clock, SlidersHorizontal, Upload, X } from 'lucide-react';
import { listingsApi } from '../api/client';
import {
  CITIES,
  LISTING_TYPE_LABELS,
  PET_TYPE_IMAGES,
  PET_TYPE_LABELS,
  type Listing,
} from '../types';
import { distanceKm, formatUkrDate, normalizeText } from '../lib/appUtils';
import { getImageEmbedding } from '../lib/clip';

const COLORS = ['Будь-який', 'Сірий', 'Чорний', 'Білий', 'Рудий', 'Триколір'];
const SORTS = ['Нові', 'Поруч зі мною', 'Популярні', 'З винагородою', 'За схожістю'] as const;
type SortOption = (typeof SORTS)[number];

const PET_CAT = ['cat', 'tabby', 'persian', 'siamese', 'egyptian cat', 'kitten'];
const PET_DOG = ['dog', 'retriever', 'terrier', 'spaniel', 'puppy', 'hound', 'poodle'];

async function detectPetType(file: File): Promise<string | null> {
  try {
    await import('@tensorflow/tfjs');
    const mobilenet = await import('@tensorflow-models/mobilenet');
    const model = await mobilenet.load();
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    await new Promise<void>(r => { img.onload = () => r(); });
    type Pred = { className: string; probability: number };
    const preds = await model.classify(img) as Pred[];
    URL.revokeObjectURL(img.src);
    for (const p of preds) {
      const c = p.className.toLowerCase();
      if (PET_CAT.some(k => c.includes(k))) return 'CAT';
      if (PET_DOG.some(k => c.includes(k))) return 'DOG';
    }
    return null;
  } catch { return null; }
}

const indexed = new Set<string>();

async function indexUnindexedListings(listings: Listing[]) {
  const toIndex = listings.filter(l => l.imageUrls?.length && !indexed.has(l.id));
  await Promise.all(
    toIndex.map(async listing => {
      const url = listing.imageUrls![0];
      indexed.add(listing.id);
      try {
        const res = await fetch(url, { credentials: 'omit' });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        const file = new File([blob], 'img.jpg', { type: blob.type });
        const embedding = await getImageEmbedding(file);
        await listingsApi.saveEmbedding(listing.id, embedding);
      } catch {
        indexed.delete(listing.id);
      }
    })
  );
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [petType, setPetType] = useState('');
  const [type, setType] = useState('');
  const [color, setColor] = useState('Будь-який');
  const [radius, setRadius] = useState(5);
  const [sort, setSort] = useState<SortOption>('Нові');
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingStatus, setAnalyzingStatus] = useState('');
  const [similarListings, setSimilarListings] = useState<Listing[] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const ensureLocation = () => {
    if (userLocation || locating || !navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 5 * 60 * 1000 }
    );
  };

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (type) params.type = type;
        if (petType) params.petType = petType;
        if (city) params.city = city;
        const res = await listingsApi.getAll(params);
        setAllListings(res.data);
      } catch {
        setAllListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [city, petType, type]);

  const listings = useMemo(() => {
    let data = [...(similarListings ?? allListings)];

    const searchTerm = normalizeText(query);
    if (searchTerm) {
      data = data.filter(listing => (
        normalizeText(listing.petName).includes(searchTerm) ||
        normalizeText(listing.breed).includes(searchTerm) ||
        normalizeText(listing.color).includes(searchTerm) ||
        normalizeText(listing.distinctiveMarks).includes(searchTerm) ||
        normalizeText(listing.description).includes(searchTerm) ||
        normalizeText(listing.addressText).includes(searchTerm) ||
        normalizeText(listing.city).includes(searchTerm)
      ));
    }

    if (color !== 'Будь-який') {
      const selectedColor = normalizeText(color);
      data = data.filter(listing => normalizeText(listing.color).includes(selectedColor));
    }

    if (userLocation && radius > 0) {
      data = data.filter(listing => {
        if (typeof listing.latitude !== 'number' || typeof listing.longitude !== 'number') {
          return true;
        }

        return distanceKm(userLocation, [listing.latitude, listing.longitude]) <= radius;
      });
    }

    switch (sort) {
      case 'Поруч зі мною':
        if (userLocation) {
          data = [...data].sort((a, b) => {
            const aHasCoords = typeof a.latitude === 'number' && typeof a.longitude === 'number';
            const bHasCoords = typeof b.latitude === 'number' && typeof b.longitude === 'number';

            if (!aHasCoords && !bHasCoords) return 0;
            if (!aHasCoords) return 1;
            if (!bHasCoords) return -1;

            const aDistance = distanceKm(userLocation, [a.latitude!, a.longitude!]);
            const bDistance = distanceKm(userLocation, [b.latitude!, b.longitude!]);
            return aDistance - bDistance;
          });
        }
        break;
      case 'Популярні':
        data = [...data].sort((a, b) => b.viewsCount - a.viewsCount);
        break;
      case 'З винагородою':
        data = [...data]
          .filter(listing => Boolean(listing.rewardAmount))
          .sort((a, b) => Number(b.rewardAmount || 0) - Number(a.rewardAmount || 0));
        break;
      case 'За схожістю':
        break; // backend returns pre-sorted results
      case 'Нові':
      default:
        data = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return data;
  }, [allListings, similarListings, color, query, radius, sort, userLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (sort === 'Поруч зі мною') {
      ensureLocation();
    }
    setShowFilters(false);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setShowFilters(true);
    setSimilarListings(null);

    try {
      setAnalyzingStatus('Визначаємо тварину...');

      // Step 1: detect pet type + compute embedding in parallel
      const [detectedType, embedding] = await Promise.all([
        detectPetType(file),
        getImageEmbedding(file),
      ]);

      if (detectedType) setPetType(detectedType);

      // Step 2: fetch base listings filtered by type + run similarity search in parallel
      setAnalyzingStatus('Шукаємо схожих...');
      const baseParams: Record<string, string> = {};
      if (detectedType) baseParams.petType = detectedType;

      const [baseRes, similarRes] = await Promise.all([
        listingsApi.getAll(baseParams),
        listingsApi.findSimilar(embedding),
      ]);

      // Step 3: merge — similarity-ranked first, then rest of same type
      if (similarRes.data.length > 0) {
        const similarIds = new Set(similarRes.data.map(l => l.id));
        setSimilarListings([
          ...similarRes.data,
          ...baseRes.data.filter(l => !similarIds.has(l.id)),
        ]);
      } else {
        setSimilarListings(baseRes.data);
      }
      setSort('За схожістю');

      // Index listing images in background for future searches
      indexUnindexedListings(baseRes.data);
    } catch {
      // fallback: normal search still visible
    } finally {
      setAnalyzing(false);
      setAnalyzingStatus('');
    }

    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilters = () => {
    setQuery('');
    setCity('');
    setPetType('');
    setType('');
    setColor('Будь-який');
    setRadius(5);
    setSort('Нові');
    setSimilarListings(null);
  };

  const activeFiltersCount = [
    query,
    city,
    petType,
    type,
    color !== 'Будь-який',
    radius !== 5,
    sort !== 'Нові',
  ].filter(Boolean).length;

  return (
    <div className="p-4 md:p-8 space-y-8 bg-bg-cream min-h-screen">
      <header>
        <h1 className="text-4xl font-serif font-bold text-text-dark mb-2">Пошук</h1>
        <p className="text-text-muted">Знайдіть оголошення за описом, місцем або породою</p>
      </header>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Порода, колір, місце, опис..."
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(f => !f)}
          className={`relative p-4 rounded-2xl border shadow-sm transition-all ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-text-dark border-gray-100 hover:bg-gray-50'}`}
          aria-label="Показати фільтри"
        >
          <SlidersHorizontal className="w-5 h-5" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
        <button type="submit" className="btn-primary px-8 rounded-2xl shadow-md">
          Знайти
        </button>
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-text-dark">Фільтри</h3>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Скинути
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* City */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Місто</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full py-3 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-dark"
              >
                <option value="">Усі міста</option>
                {CITIES.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            {/* Pet Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Тип тварини</label>
              <select
                value={petType}
                onChange={e => setPetType(e.target.value)}
                className="w-full py-3 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-dark"
              >
                <option value="">Усі</option>
                {Object.entries(PET_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Тип оголошення</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full py-3 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-dark"
              >
                <option value="">Усі</option>
                {Object.entries(LISTING_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Колір</label>
              <select
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full py-3 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-dark"
              >
                {COLORS.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          {/* Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Радіус пошуку</label>
              <span className="text-sm font-bold text-primary">
                {radius} км
                {locating ? ' · визначаємо місце...' : ''}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={radius}
              onChange={e => {
                setRadius(Number(e.target.value));
                ensureLocation();
              }}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted font-medium">
              <span>1 км</span><span>20 км</span>
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Сортування</label>
            <div className="flex flex-wrap gap-2">
              {SORTS.filter(o => o !== 'За схожістю' || similarListings !== null).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    if (option === 'Поруч зі мною') ensureLocation();
                    setSort(option);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    sort === option
                      ? 'bg-text-dark text-white shadow-md'
                      : 'bg-white border border-gray-100 text-text-dark hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Photo Search */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-bold text-text-dark mb-1">AI пошук за фото</h3>
          <p className="text-sm text-text-muted">
            Завантажте фото тварини — AI визначить вид і автоматично встановить фільтр.
          </p>
          {analyzing && (
            <p className="text-xs font-medium text-primary mt-2 animate-pulse">
              {analyzingStatus || 'Аналізуємо...'}
            </p>
          )}
          {!analyzing && similarListings !== null && (
            <p className="text-xs font-medium text-green-600 mt-2">
              Знайдено {similarListings.length} схожих оголошень
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={analyzing}
            className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-6 rounded-2xl shadow-md hover:bg-primary-hover transition-all disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {analyzing ? 'Аналізуємо...' : 'Обрати фото'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div ref={resultsRef}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-dark">
            {loading ? 'Шукаємо...' : `Знайдено: ${listings.length} оголошень`}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(item => (
              <div key={item} className="bg-white rounded-3xl h-72 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-text-dark mb-2">Нічого не знайдено</h3>
            <p className="text-text-muted">Спробуйте змінити фільтри або пошуковий запит</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <Link key={listing.id} to={`/listing/${listing.id}`} className="group">
                <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    <img
                      src={(listing.imageUrls && listing.imageUrls.length > 0) ? listing.imageUrls[0] : (PET_TYPE_IMAGES[listing.petType] || PET_TYPE_IMAGES.OTHER)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={listing.petName || 'Тваринка'}
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-md ${listing.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
                        {listing.type === 'LOST' ? 'Загублено' : 'Знайдено'}
                      </span>
                      {listing.rewardAmount && (
                        <span className="px-3 py-1 bg-white text-primary rounded-full text-[10px] font-black shadow-md border">
                          {listing.rewardAmount} ₴
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-text-dark text-lg">{listing.petName || 'Без імені'}</h3>
                      <span className="text-[10px] text-text-muted font-bold flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {formatUkrDate(listing.createdAt, { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {(listing.breed || listing.petType) && (
                      <p className="text-sm text-text-muted font-medium">
                        {PET_TYPE_LABELS[listing.petType]}
                        {listing.breed ? ` · ${listing.breed}` : ''}
                      </p>
                    )}
                    {listing.addressText && (
                      <p className="text-sm text-text-muted flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary/60" />
                        {listing.addressText}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




 
 
 
 
