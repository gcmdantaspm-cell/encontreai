export type UserRole = 'client' | 'professional';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarInitial: string;
  avatarUrl?: string;
  favorites: string[];
  createdAt: string;
  cpfCnpj?: string;
  phone?: string;
  region?: string;
}

export interface ProfService {
  id: string;
  professionalId?: string;
  title: string;
  description?: string;
  categoryId?: string;
  duration?: string;
  price: number;
  imageUrls?: string[]; // Array of base64 images (max 3)
  paymentMethods?: string[]; // e.g. ['pix', 'credit', 'debit', 'cash']
  availableDays?: number[]; // 0=Sun, 1=Mon...
  availableHours?: string[]; // e.g. ['09:00', '10:00']
}

export interface Professional extends AppUser {
  profession: string;
  description: string;
  categoryId: string;
  coverUrl?: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  activeSubscription: boolean;
  services: ProfService[];
}

export interface Appointment {
  id: string;
  professionalId: string;
  clientId: string;
  serviceId: string;
  serviceTitle: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  clientName: string;
  professionalName: string;
  reviewed?: boolean; // Se o cliente já avaliou
  createdAt: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Review {
  id: string;
  professionalId: string;
  clientId: string;
  clientName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  professionalId: string;
  code: string;
  discountPercent: number;
  active: boolean;
}
