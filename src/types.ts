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
  createdAt: string;
}

export interface ProfService {
  id: string;
  professionalId: string;
  title: string;
  description?: string;
  category?: string;
  price: number;
  duration?: number; // duration in minutes
}

export interface Professional {
  id: string;
  name: string;
  profession: string;
  description: string;
  categoryId: string;
  avatarUrl: string;
  coverUrl: string;
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
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  clientName: string;
  professionalName: string;
  createdAt: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Material Symbols icon name
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

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  icon: string;
  createdAt: string;
}
