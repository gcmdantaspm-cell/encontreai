export type UserRole = 'client' | 'professional';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarInitial: string;
  avatarUrl?: string;
  profession?: string;
  categoryId?: string;
  cpfCnpj?: string;
  password?: string;
  favorites?: string[]; // IDs dos profissionais favoritos
  createdAt: string;
}

export interface ProfService {
  id: string;
  professionalId: string;
  title: string;
  description?: string;
  category?: string;
  price: number;
  duration?: number; // minutos
}

export interface Professional {
  id: string;
  name: string;
  profession: string;
  description: string;
  categoryId: string;
  avatarUrl: string;
  coverUrl: string;
  portfolio?: string[]; // Galeria de fotos
  rating: number;
  reviewsCount: number;
  verified: boolean;
  activeSubscription: boolean;
  services: ProfService[];
  location?: string;
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
