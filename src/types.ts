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
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
