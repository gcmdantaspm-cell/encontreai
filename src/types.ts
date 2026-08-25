export type UserRole = 'client' | 'professional';

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Professional {
  id: string;
  name: string;
  profession: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  activeSubscription: boolean;
  avatarUrl: string;
  coverUrl: string;
  description: string;
  portfolio: string[];
  reviews: Review[];
  whatsapp?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  avatarInitial: string;
  profession?: string;
  categoryId?: string;
  cpfCnpj?: string;
  createdAt: string;
}

export interface OrcamentoRequest {
  id: string;
  userId: string;
  professionalId: string;
  professionalName: string;
  profession: string;
  message: string;
  contactTime: string;
  status: 'pending' | 'viewed' | 'responded';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  icon: string;
}
