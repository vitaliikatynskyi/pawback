export const STORAGE_KEYS = {
  savedListings: 'pawback.savedListings',
  helpedListings: 'pawback.helpedListings',
  listingImagesPrefix: 'pawback.listingImages',
} as const;

type JwtPayload = {
  sub?: string;
  email?: string;
  [key: string]: unknown;
};

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
};

export const loadStoredStringArray = (key: string): string[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const saveStoredStringArray = (key: string, values: string[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(values));
};

export const toggleStoredStringArrayItem = (key: string, value: string) => {
  const current = loadStoredStringArray(key);
  const next = current.includes(value)
    ? current.filter(item => item !== value)
    : [...current, value];

  saveStoredStringArray(key, next);
  return next;
};

export const getListingImagesKey = (listingId: string) => `${STORAGE_KEYS.listingImagesPrefix}:${listingId}`;

export const saveListingImages = (listingId: string, urls: string[]) => {
  saveStoredStringArray(getListingImagesKey(listingId), urls);
};

export const loadListingImages = (listingId: string) => loadStoredStringArray(getListingImagesKey(listingId));

export const decodeJwtPayload = (token?: string | null): JwtPayload | null => {
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
};

export const getJwtSubject = (token?: string | null) => decodeJwtPayload(token)?.sub ?? decodeJwtPayload(token)?.email ?? null;

export const distanceKm = (from: [number, number], to: [number, number]) => {
  const [lat1, lon1] = from;
  const [lat2, lon2] = to;
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const deltaLat = toRad(lat2 - lat1);
  const deltaLon = toRad(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

export const formatUkrDate = (
  value: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('uk-UA', options).format(date);
};

export const normalizeText = (value?: string | null) => (value ?? '').toLowerCase().trim();
