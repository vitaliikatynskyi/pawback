import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Flag,
  MapPin,
  MessageCircle,
  Phone,
  CheckCircle2,
  Heart,
  Eye,
  Send,
  RefreshCw,
  Loader2,
  Check,
  Edit,
  Archive,
} from 'lucide-react';
import { listingsApi, usersApi } from '../api/client';
import {
  LISTING_TYPE_LABELS,
  PET_TYPE_IMAGES,
  PET_TYPE_LABELS,
  type Comment,
  type Listing,
  type User,
} from '../types';
import {
  STORAGE_KEYS,
  formatUkrDate,
  loadListingImages,
  loadStoredStringArray,
  saveStoredStringArray,
  toggleStoredStringArrayItem,
} from '../lib/appUtils';

const buildFallbackGallery = (petType: Listing['petType']) => {
  const ordered = [
    PET_TYPE_IMAGES[petType] || PET_TYPE_IMAGES.OTHER,
    PET_TYPE_IMAGES.CAT,
    PET_TYPE_IMAGES.DOG,
  ];

  return ordered.filter((url, index, array) => array.indexOf(url) === index || index === 0);
};

export default function ListingDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const commentInputRef = useRef<HTMLInputElement>(null);

  const [listing, setListing] = useState<Listing | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshingComments, setRefreshingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(
    () => loadStoredStringArray(STORAGE_KEYS.savedListings)
  );
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadComments = async (listingId: string) => {
    const response = await listingsApi.getComments(listingId);
    setComments(response.data);
  };

  useEffect(() => {
    if (!id) return;

    const loadListing = async () => {
      setLoading(true);
      setError('');
      setNotice('');

      try {
        const token = localStorage.getItem('token');
        const [listingResponse, userResponse] = await Promise.all([
          listingsApi.getById(id),
          token ? usersApi.getMe().catch(() => null) : Promise.resolve(null),
        ]);
        if (userResponse) setCurrentUser(userResponse.data);
        const currentListing = listingResponse.data;
        setListing(currentListing);

        const [commentsResponse] = await Promise.all([
          listingsApi.getComments(id),
        ]);
        setComments(commentsResponse.data);

        const localImages = loadListingImages(id);
        const apiImages = currentListing.imageUrls || [];
        
        setGalleryImages(
          apiImages.length > 0
            ? apiImages
            : localImages.length > 0
              ? localImages
              : buildFallbackGallery(currentListing.petType)
        );
        setCurrentImageIndex(0);

        const params: Record<string, string> = {
          type: currentListing.type,
          petType: currentListing.petType,
        };
        if (currentListing.city) {
          params.city = currentListing.city;
        }

        const similarResponse = await listingsApi.getAll(params);
        setSimilarListings(
          similarResponse.data
            .filter(item => item.id !== currentListing.id)
            .slice(0, 3)
        );
      } catch {
        setError('Не вдалося завантажити оголошення. Спробуйте ще раз.');
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [id]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 2500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const isFavorite = Boolean(id && favoriteIds.includes(id));

  const handleToggleFavorite = () => {
    if (!id) return;
    const next = toggleStoredStringArrayItem(STORAGE_KEYS.savedListings, id);
    setFavoriteIds(next);
    setNotice(next.includes(id) ? 'Додано до збережених' : 'Прибрано зі збережених');
  };

  const handleShare = async () => {
    if (!listing) return;
    const shareData = {
      title: `${LISTING_TYPE_LABELS[listing.type]}: ${listing.petName || 'Без імені'}`,
      text: listing.description || '',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setNotice('Посилання відкрито для поширення');
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setNotice('Посилання скопійовано');
    } catch {
      setNotice('Не вдалося поширити посилання');
    }
  };

  const handleReport = () => {
    setNotice('Скаргу додано до черги модерації');
  };

  const openChat = () => {
    if (!listing) return;
    navigate(`/messages?userId=${listing.author.id}&name=${encodeURIComponent(listing.author.displayName || 'Користувач')}`);
  };

  const copyContact = async () => {
    if (!listing) return;
    const contact = listing.author.username ? `@${listing.author.username}` : listing.author.displayName || 'Контакт приховано';
    try {
      await navigator.clipboard.writeText(contact);
      setNotice('Контакт скопійовано');
    } catch {
      setNotice(`Контакт: ${contact}`);
    }
  };

  const handleSightingPrompt = () => {
    if (!listing) return;
    setCommentText(`Бачив(ла) схожу тварину біля ${listing.addressText || listing.city || 'вказаної локації'}.`);
    commentInputRef.current?.focus();
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !commentText.trim()) return;

    setPostingComment(true);
    try {
      const response = await listingsApi.addComment(id, commentText.trim());
      setComments(previous => [response.data, ...previous]);
      setCommentText('');

      const helped = loadStoredStringArray(STORAGE_KEYS.helpedListings);
      if (!helped.includes(id)) {
        saveStoredStringArray(STORAGE_KEYS.helpedListings, [...helped, id]);
      }

      setNotice('Свідчення додано');
    } catch {
      setError('Не вдалося додати свідчення');
    } finally {
      setPostingComment(false);
    }
  };

  const handleStatusUpdate = async (status: 'ACTIVE' | 'RESOLVED' | 'ARCHIVED') => {
    if (!listing || !id) return;
    setUpdatingStatus(true);
    try {
      const res = await listingsApi.updateStatus(id, status);
      setListing(prev => prev ? { ...prev, status: res.data.status } : null);
      const labels: Record<string, string> = { RESOLVED: 'Позначено як знайдено', ARCHIVED: 'Оголошення архівовано', ACTIVE: 'Оголошення знову активне' };
      setNotice(labels[status] || 'Статус оновлено');
    } catch {
      setError('Не вдалося змінити статус');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const refreshComments = async () => {
    if (!id) return;
    setRefreshingComments(true);
    try {
      await loadComments(id);
      setNotice('Свідчення оновлено');
    } catch {
      setError('Не вдалося оновити свідчення');
    } finally {
      setRefreshingComments(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          <div className="h-6 w-48 bg-white rounded-full animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="aspect-[4/3] rounded-[32px] bg-white animate-pulse" />
              <div className="h-28 rounded-[32px] bg-white animate-pulse" />
              <div className="h-64 rounded-[32px] bg-white animate-pulse" />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="h-56 rounded-[32px] bg-white animate-pulse" />
              <div className="h-56 rounded-[32px] bg-white animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="bg-bg-cream min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">🐾</div>
          <h1 className="text-2xl font-bold text-text-dark mb-2">Оголошення не знайдено</h1>
          <p className="text-text-muted mb-6">{error}</p>
          <Link to="/" className="btn-primary px-6 rounded-2xl shadow-md">
            <ArrowLeft className="w-4 h-4" />
            Назад до стрічки
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const activeImage = galleryImages[currentImageIndex] || PET_TYPE_IMAGES[listing.petType] || PET_TYPE_IMAGES.OTHER;

  return (
    <div className="bg-bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-28 md:pb-8 space-y-4 md:space-y-8">
        {notice && (
          <div className="rounded-2xl border border-green-100 bg-green-50 text-green-700 px-4 py-3 text-sm font-medium">
            {notice}
          </div>
        )}
        {error && listing && (
          <div className="rounded-2xl border border-red-100 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Header Controls */}
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-dark font-medium transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Назад до стрічки
          </Link>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
            {currentUser?.id === listing.author.id && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/edit/${listing.id}`)}
                  className="p-3 bg-white rounded-2xl border border-gray-100 text-primary hover:bg-orange-50 transition-colors flex items-center gap-2"
                  aria-label="Редагувати"
                >
                  <Edit className="w-5 h-5" />
                  <span className="hidden md:inline font-bold">Редагувати</span>
                </button>
                {listing.status === 'ACTIVE' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('RESOLVED')}
                    disabled={updatingStatus}
                    className="p-3 bg-green-50 rounded-2xl border border-green-100 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-2 font-bold text-sm disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    <span className="hidden md:inline">Знайдено!</span>
                  </button>
                ) : listing.status === 'RESOLVED' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('ACTIVE')}
                    disabled={updatingStatus}
                    className="p-3 bg-orange-50 rounded-2xl border border-orange-100 text-primary hover:bg-orange-100 transition-colors flex items-center gap-2 font-bold text-sm disabled:opacity-50"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span className="hidden md:inline">Відкрити знову</span>
                  </button>
                ) : null}
                {listing.status !== 'ARCHIVED' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('ARCHIVED')}
                    disabled={updatingStatus}
                    className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-text-muted hover:bg-gray-100 transition-colors flex items-center gap-2 font-bold text-sm disabled:opacity-50"
                    title="Архівувати"
                  >
                    <Archive className="w-5 h-5" />
                    <span className="hidden md:inline">В архів</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('ACTIVE')}
                    disabled={updatingStatus}
                    className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-2 font-bold text-sm disabled:opacity-50"
                    title="Відновити з архіву"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span className="hidden md:inline">Відновити</span>
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={handleShare}
              className="p-3 bg-white rounded-2xl border border-gray-100 text-text-muted hover:text-text-dark transition-colors"
              aria-label="Поширити"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleReport}
              className="p-3 bg-white rounded-2xl border border-gray-100 text-text-muted hover:text-text-dark transition-colors"
              aria-label="Поскаржитися"
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            {/* Gallery */}
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-[32px] md:rounded-[40px] overflow-hidden bg-white relative shadow-sm">
                <img src={activeImage} className="w-full h-full object-cover" alt={listing.petName || 'Оголошення'} />
                <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-wrap gap-2 md:gap-3">
                  <div className={`text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg ${listing.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {LISTING_TYPE_LABELS[listing.type]}
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm text-text-dark px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 border border-white">
                    <span>Тип:</span>
                    <span className="text-primary font-black">{PET_TYPE_LABELS[listing.petType]}</span>
                  </div>
                  {listing.rewardAmount && (
                    <div className="bg-white/90 backdrop-blur-sm text-text-dark px-4 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white">
                      Винагорода: <span className="text-primary font-black">{listing.rewardAmount} {listing.rewardCurrency || 'UAH'}</span>
                    </div>
                  )}
                </div>
              </div>

              {galleryImages.length > 1 && (
                <div className="flex gap-3 md:gap-4 overflow-x-auto pb-1">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-4 transition-all shrink-0 ${index === currentImageIndex ? 'border-orange-200' : 'border-white'}`}
                    >
                      <img src={image} className="w-full h-full object-cover" alt={`Фото ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-text-dark">
                      {LISTING_TYPE_LABELS[listing.type]}: {listing.petName || 'Без імені'}
                    </h1>
                    {listing.status === 'RESOLVED' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">✓ Знайдено</span>
                    )}
                    {listing.status === 'ARCHIVED' && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-bold">Архів</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-text-muted text-sm font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      {listing.viewsCount} переглядів
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      {formatUkrDate(listing.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-text-muted text-sm font-medium">
                  <Eye className="w-4 h-4" />
                  <span>{listing.contactsCount} контактів</span>
                </div>
              </div>

              <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-3xl">
                {listing.description || 'Опис поки що не додано.'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-[28px] md:rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
              <div className="bg-white p-5 md:p-6 space-y-1">
                <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Тип</div>
                <div className="text-lg font-bold text-text-dark">{PET_TYPE_LABELS[listing.petType]}</div>
              </div>
              <div className="bg-white p-5 md:p-6 space-y-1">
                <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Порода</div>
                <div className="text-lg font-bold text-text-dark">{listing.breed || 'Не вказано'}</div>
              </div>
              <div className="bg-white p-5 md:p-6 space-y-1">
                <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Колір</div>
                <div className="text-lg font-bold text-text-dark">{listing.color || 'Не вказано'}</div>
              </div>
              <div className="bg-white p-5 md:p-6 space-y-1">
                <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Прикмети</div>
                <div className="text-lg font-bold text-text-dark">{listing.distinctiveMarks || 'Не вказано'}</div>
              </div>
              <div className="bg-white p-5 md:p-6 space-y-1">
                <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Дата</div>
                <div className="text-lg font-bold text-text-dark">
                  {listing.eventDate ? formatUkrDate(listing.eventDate, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Не вказано'}
                </div>
              </div>
              <div className="bg-white p-5 md:p-6 space-y-1">
                <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Місце</div>
                <div className="text-lg font-bold text-text-dark">{[listing.addressText, listing.district].filter(Boolean).join(', ') || 'Не вказано'}</div>
              </div>
            </div>

            {/* Map Snippet */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-text-dark">Локація на карті</h3>
                  <p className="text-sm text-text-muted mt-1">
                    {listing.city || 'Місто не вказано'} · {listing.addressText || 'Точне місце не вказано'}
                  </p>
                </div>
                <Link
                  to="/map"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-100 text-text-dark font-bold hover:bg-gray-50 transition-all"
                >
                  <MapPin className="w-4 h-4 text-primary" />
                  Відкрити карту
                </Link>
              </div>
              <div className="h-56 rounded-[28px] overflow-hidden bg-blue-50 relative border border-gray-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(232,112,74,0.15),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.7),rgba(245,239,231,0.9))]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 bg-primary/10 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
                      <div className="w-4 h-4 bg-primary rounded-full shadow-lg border-2 border-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-text-dark flex items-center gap-2 border border-white">
                    <MapPin className="w-4 h-4 text-primary" />
                    {listing.latitude && listing.longitude ? `${listing.latitude.toFixed(4)}, ${listing.longitude.toFixed(4)}` : 'Координати не збережено'}
                  </div>
                </div>
              </div>
            </div>

            {/* Interaction Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3 md:gap-4">
              <button
                type="button"
                onClick={handleSightingPrompt}
                className="btn-primary py-4 rounded-2xl shadow-lg shadow-orange-100"
              >
                <Eye className="w-5 h-5" />
                <span>Я бачив цю тваринку</span>
              </button>
              {currentUser?.id !== listing.author.id && (
                <button
                  type="button"
                  onClick={openChat}
                  className="bg-white border border-gray-100 text-text-dark font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Написати власнику</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`w-full sm:w-16 h-16 rounded-2xl border flex items-center justify-center transition-all ${isFavorite ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-100 text-text-muted hover:text-text-dark'}`}
                aria-label="Зберегти оголошення"
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Evidence Section */}
            <div id="comments" className="card space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-serif font-bold text-text-dark">Свідчення ({comments.length})</h3>
                <button
                  type="button"
                  onClick={refreshComments}
                  className="text-text-muted hover:text-text-dark transition-colors"
                  aria-label="Оновити свідчення"
                >
                  {refreshingComments ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                </button>
              </div>

              <div className="space-y-5">
                {comments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-text-muted">
                    Поки що немає свідчень. Додайте перше.
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {comment.author.displayName?.[0]?.toUpperCase() || 'О'}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-text-dark">{comment.author.displayName || 'Користувач'}</span>
                          <span className="text-text-muted text-xs font-medium">
                            {formatUkrDate(comment.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-text-muted text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl rounded-tl-none inline-block">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleCommentSubmit} className="relative pt-2">
                <div className="absolute left-0 top-3 w-12 h-12 bg-orange-100 text-primary rounded-full flex items-center justify-center font-bold">
                  {currentUser?.displayName?.[0]?.toUpperCase() || '?'}
                </div>
                <input
                  ref={commentInputRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-gray-100 rounded-full pl-16 pr-16 py-4 focus:outline-none transition-all"
                  placeholder="Поділіться, де бачили..."
                />
                <button
                  type="submit"
                  disabled={postingComment || !commentText.trim()}
                  className="absolute right-4 top-3 p-2 bg-primary text-white rounded-full hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Надіслати свідчення"
                >
                  {postingComment ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 translate-x-[2px] -translate-y-[1px]" />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            {/* Owner Card */}
            <div className="card space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                  {listing.author.displayName?.[0]?.toUpperCase() || 'О'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-text-dark truncate">{listing.author.displayName || 'Користувач'}</h4>
                    {listing.author.isVerifiedDiia && <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />}
                  </div>
                  <p className="text-text-muted text-sm font-medium">
                    {listing.author.username ? `@${listing.author.username}` : 'Нік не вказано'}
                    {listing.author.city ? ` · ${listing.author.city}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentUser?.id !== listing.author.id && (
                  <button
                    type="button"
                    onClick={openChat}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold text-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Чат
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyContact}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-100 text-text-dark py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Контакти
                </button>
              </div>
              {listing.author.isVerifiedDiia && (
                <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                  Верифікований через Дію
                </div>
              )}
            </div>

            {/* Guide Card */}
            <div className="card space-y-5">
              <h4 className="text-xl font-serif font-bold text-text-dark">Що робити, якщо побачили</h4>
              <ul className="space-y-4">
                {[
                  'Не намагайтеся ловити - тварина може злякатися',
                  'Сфотографуйте здалеку',
                  'Напишіть власнику в чат',
                  'Залишайтеся поряд, якщо це безпечно',
                ].map((text, index) => (
                  <li key={text} className="flex gap-3 text-sm text-text-muted leading-relaxed">
                    <span className="font-bold text-text-dark">{index + 1}.</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Similar Listings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-serif font-bold text-text-dark">Схожі оголошення</h4>
                <div className="text-primary font-bold">✨</div>
              </div>

              <div className="space-y-4">
                {similarListings.length === 0 ? (
                  <div className="card text-sm text-text-muted text-center">
                    Поки що немає схожих оголошень.
                  </div>
                ) : (
                  similarListings.map(item => (
                    <Link key={item.id} to={`/listing/${item.id}`} className="card p-0 overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-none">
                      <div className="aspect-[4/3] relative">
                        <img
                          src={(item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : (PET_TYPE_IMAGES[item.petType] || PET_TYPE_IMAGES.OTHER)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={item.petName || 'Схоже оголошення'}
                        />
                        <div className={`absolute top-4 right-4 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md ${item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
                          {LISTING_TYPE_LABELS[item.type]}
                        </div>
                      </div>
                      <div className="p-4 space-y-1">
                        <h5 className="font-bold text-text-dark">{item.petName || 'Без імені'}</h5>
                        <p className="text-text-muted text-xs font-medium">{item.addressText || item.city || 'Локація не вказана'}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




 
 
 
 
