export interface User {
  id: string;
  email?: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  city?: string;
  phoneNumber?: string;
  bio?: string;
  isVerifiedDiia?: boolean;
  rating?: number;
  createdAt: string;
}

export interface Listing {
  id: string;
  type: 'LOST' | 'FOUND';
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED' | 'ARCHIVED';
  petType: 'CAT' | 'DOG' | 'OTHER';
  petName?: string;
  breed?: string;
  color?: string;
  distinctiveMarks?: string;
  description?: string;
  eventDate?: string;
  city?: string;
  district?: string;
  addressText?: string;
  rewardAmount?: number;
  rewardCurrency?: string;
  viewsCount: number;
  contactsCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  latitude?: number;
  longitude?: number;
  imageUrls?: string[];
  author: User;
}

export interface Comment {
  id: number;
  content: string;
  author: User;
  createdAt: string;
}

export interface ChatContact {
  id: string;
  displayName: string;
  email: string;
}

export interface ChatMessage {
  id: number;
  sender: User;
  recipient: User;
  content: string;
  latitude?: number;
  longitude?: number;
  fileUrl?: string;
  fileType?: 'IMAGE' | 'FILE' | 'LOCATION';
  timestamp: string;
}

export type PetType = 'CAT' | 'DOG' | 'OTHER';
export type ListingType = 'LOST' | 'FOUND';
export type ListingStatus = 'ACTIVE' | 'RESOLVED' | 'EXPIRED' | 'ARCHIVED';

export const PET_TYPE_LABELS: Record<PetType, string> = {
  CAT: 'Кіт',
  DOG: 'Пес',
  OTHER: 'Інше',
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  LOST: 'Загублено',
  FOUND: 'Знайдено',
};

export const CITIES = ['Київ', 'Львів', 'Вінниця', 'Луцьк', 'Дніпро', 'Ужгород', 'Житомир'];

export const PET_TYPE_IMAGES: Record<PetType, string> = {
  CAT: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1200&auto=format&fit=crop',
  DOG: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=1200&auto=format&fit=crop',
  OTHER: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?q=80&w=1200&auto=format&fit=crop',
};




 
 
 
 
