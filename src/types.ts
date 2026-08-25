export type UserRole = 'client' | 'professional';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  avatarInitial: string;
  profession?: string;
  categoryId?: string;
  cpfCnpj?: string;
  createdAt: string;
}

export interface ProfService {
  id: string;
  professionalId: string;
  title: string;
  price: number;
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
  status: 'pending' | 'approved' | 'cancelled';
  clientName: string;
  professionalName: string;
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

export interface Professional {
  id: string;
  name: string;
  profession: string;
  categoryId: string;
  rating: number;
  reviewsCount: number;
  avatarUrl: string;
  coverUrl: string;
  description: string;
  verified: boolean;
  activeSubscription: boolean;
  portfolio: string[];
  reviews: Array<{
    id: string;
    authorName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
