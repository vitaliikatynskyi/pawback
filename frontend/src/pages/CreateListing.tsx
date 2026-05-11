import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Check, MapPin, Plus, Trash2, LocateFixed } from 'lucide-react';
import { listingsApi } from '../api/client';
import { PET_TYPE_LABELS, type PetType } from '../types';
import { saveListingImages } from '../lib/appUtils';

type ListingType = 'LOST' | 'FOUND';

type DraftImage = {
  file: File;
  preview: string;
};

const PET_TYPES: PetType[] = ['CAT', 'DOG', 'OTHER'];

export default function CreateListing() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [images, setImages] = useState<DraftImage[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<ListingType>('LOST');
  const [petType, setPetType] = useState<PetType>('CAT');
  const [petName, setPetName] = useState('');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [distinctiveMarks, setDistinctiveMarks] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [addressText, setAddressText] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardCurrency, setRewardCurrency] = useState('UAH');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      listingsApi.getById(id)
        .then(res => {
          const data = res.data;
          setType(data.type as ListingType);
          setPetType(data.petType as PetType);
          setPetName(data.petName || '');
          setBreed(data.breed || '');
          setColor(data.color || '');
          setDistinctiveMarks(data.distinctiveMarks || '');
          setDescription(data.description || '');
          setCity(data.city || '');
          setDistrict(data.district || '');
          setAddressText(data.addressText || '');
          if (data.eventDate) setEventDate(new Date(data.eventDate).toISOString().slice(0, 16));
          setRewardAmount(data.rewardAmount?.toString() || '');
          setRewardCurrency(data.rewardCurrency || 'UAH');
          setLatitude(data.latitude?.toString() || '');
          setLongitude(data.longitude?.toString() || '');
          setExistingImages(data.imageUrls || []);
        })
        .catch(() => setError('Не вдалося завантажити дані для редагування'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  useEffect(() => {
    return () => {
      images.forEach(image => URL.revokeObjectURL(image.preview));
    };
  }, [images]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const draftImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(previous => [...previous, ...draftImages]);
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(previous => {
      const next = [...previous];
      const [removed] = next.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return next;
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (images.length === 0) return [] as string[];

    const API_URL = import.meta.env.VITE_API_URL || '';
    const token = localStorage.getItem('token');

    const uploaded = await Promise.all(
      images.map(async image => {
        const formData = new FormData();
        formData.append('file', image.file);

        const response = await fetch(`${API_URL}/api/files/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Не вдалося завантажити фото');
        }

        const data = await response.json();
        return data.url as string;
      })
    );

    return uploaded;
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Браузер не підтримує геолокацію');
      return;
    }

    setError('');
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocationLoading(false);
      },
      () => {
        setError('Не вдалося визначити геолокацію');
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 5 * 60 * 1000 }
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const newImageUrls = await uploadImages();
      const allImageUrls = [...existingImages, ...newImageUrls];
      
      const payload = {
        type,
        petType,
        petName: petName.trim() || undefined,
        breed: breed.trim() || undefined,
        color: color.trim() || undefined,
        distinctiveMarks: distinctiveMarks.trim() || undefined,
        description: description.trim() || undefined,
        eventDate: eventDate || undefined,
        city: city.trim() || undefined,
        district: district.trim() || undefined,
        addressText: addressText.trim() || undefined,
        rewardAmount: type === 'LOST' && rewardAmount ? Number(rewardAmount) : undefined,
        rewardCurrency: type === 'LOST' ? rewardCurrency : undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        imageUrls: allImageUrls,
      };

      let response;
      if (isEdit) {
        response = await listingsApi.update(id!, payload);
      } else {
        response = await listingsApi.create(payload);
      }

      if (allImageUrls.length > 0) {
        saveListingImages(response.data.id, allImageUrls);
      }

      navigate(`/listing/${response.data.id}`, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Помилка при збереженні');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-cream min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-dark font-medium transition-colors mb-3">
              <ArrowLeft className="w-4 h-4" />
              Назад до стрічки
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-text-dark">
              {isEdit ? 'Редагувати оголошення' : 'Створити оголошення'}
            </h1>
            <p className="text-sm md:text-base text-text-muted mt-2">
              {isEdit ? 'Оновіть інформацію про тварину.' : 'Заповніть дані про тварину і відразу опублікуйте оголошення.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseLocation}
            disabled={locationLoading}
            className="hidden md:inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-gray-100 font-bold text-text-dark hover:bg-gray-50 transition-all"
          >
            <LocateFixed className="w-4 h-4 text-primary" />
            {locationLoading ? 'Визначаємо...' : 'Моя локація'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <section className="card space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-text-dark">Тип оголошення</h2>
                  <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Крок 1</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('LOST')}
                    className={`py-4 rounded-2xl font-bold transition-all border-2 ${type === 'LOST' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-100 text-text-muted hover:border-gray-200'}`}
                  >
                    Я загубив тваринку
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('FOUND')}
                    className={`py-4 rounded-2xl font-bold transition-all border-2 ${type === 'FOUND' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-gray-100 text-text-muted hover:border-gray-200'}`}
                  >
                    Я знайшов тваринку
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Тип тварини</label>
                    <select
                      value={petType}
                      onChange={e => setPetType(e.target.value as PetType)}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                    >
                      {PET_TYPES.map(option => (
                        <option key={option} value={option}>{PET_TYPE_LABELS[option]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">
                      {type === 'LOST' ? "Ім'я тварини" : "Кличка (якщо знаєте)"}
                    </label>
                    <input
                      type="text"
                      value={petName}
                      onChange={e => setPetName(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                      placeholder={type === 'LOST' ? "Наприклад: Барсик" : "Залиште порожнім, якщо не знаєте"}
                    />
                  </div>
                </div>
              </section>

              <section className="card space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-text-dark">Опис</h2>
                  <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Крок 2</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Порода</label>
                    <input
                      type="text"
                      value={breed}
                      onChange={e => setBreed(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                      placeholder="Британський"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Колір</label>
                    <input
                      type="text"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                      placeholder="Сірий, рудий, чорний..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Особливі прикмети</label>
                  <input
                    type="text"
                    value={distinctiveMarks}
                    onChange={e => setDistinctiveMarks(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                    placeholder="Білі лапки, ошийник, шрам..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Детальний опис</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark min-h-[150px]"
                    placeholder="Опишіть обставини, поведінку, контактну інформацію та все, що допоможе знайти тварину."
                    required
                  />
                </div>
              </section>

              <section className="card space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-text-dark">Локація і дата</h2>
                  <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Крок 3</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Місто</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                      placeholder="Київ"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Район</label>
                    <input
                      type="text"
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                      placeholder="Печерський"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Точне місце</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      value={addressText}
                      onChange={e => setAddressText(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                      placeholder="Вул. Хрещатик, 15"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Дата події</label>
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                    />
                  </div>
                  {type === 'LOST' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Винагорода</label>
                      <div className="grid grid-cols-[1fr_120px] gap-3">
                        <input
                          type="number"
                          min="0"
                          value={rewardAmount}
                          onChange={e => setRewardAmount(e.target.value)}
                          className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                          placeholder="5000"
                        />
                        <select
                          value={rewardCurrency}
                          onChange={e => setRewardCurrency(e.target.value)}
                          className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                        >
                          <option value="UAH">UAH</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Координати</label>
                      <p className="text-xs text-text-muted mt-1">Необов'язково, але це допоможе показати оголошення на карті.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      disabled={locationLoading}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-100 font-bold text-text-dark hover:bg-gray-50 transition-all text-sm"
                    >
                      <LocateFixed className="w-4 h-4 text-primary" />
                      {locationLoading ? 'Визначаємо...' : 'Визначити місце'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={e => setLatitude(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                      placeholder="Широта"
                    />
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={e => setLongitude(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-text-dark"
                      placeholder="Довгота"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <section className="card space-y-4 sticky top-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-text-dark">Фото</h2>
                  <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{images.length} файлів</span>
                </div>
                <p className="text-sm text-text-muted">Фото зберігаються на сервері та доступні з будь-якого пристрою.</p>
                <div className="grid grid-cols-2 gap-3">
                  {existingImages.map((url, index) => (
                    <div key={`existing-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                      <img src={url} alt="existing" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow-md"
                        aria-label="Видалити фото"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {images.map((image, index) => (
                    <div key={`${image.preview}-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                      <img src={image.preview} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow-md"
                        aria-label="Видалити фото"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-primary cursor-pointer hover:bg-primary/10 transition-colors"
                  >
                    <Camera className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold">Додати фото</span>
                  </button>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
                <div className="text-xs text-text-muted leading-relaxed">
                  Натисніть на плитку, щоб завантажити фото. Підтримуються формати JPG, PNG, WebP до 10 МБ.
                </div>
              </section>

              <section className="card space-y-4">
                <h2 className="text-xl font-bold text-text-dark">Підсумок</h2>
                <div className="space-y-3 text-sm text-text-muted">
                  <div className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-primary mt-0.5" />
                    <span>{type === 'LOST' ? 'Оголошення про пошук загубленої тварини' : 'Оголошення про знайдену тварину'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-primary mt-0.5" />
                    <span>Фото та координати можна уточнити перед публікацією.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-primary mt-0.5" />
                    <span>Після створення ви потрапите прямо на сторінку оголошення.</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-lg disabled:opacity-50 rounded-2xl py-4"
          >
            {loading ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Опублікувати оголошення'}
            {!loading && (isEdit ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
          </button>
        </form>
      </div>
    </div>
  );
}
 
 
 
 
