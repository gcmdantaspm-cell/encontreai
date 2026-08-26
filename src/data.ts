import { Category, Professional, Review, Coupon, ChatMessage } from './types';

export const CATEGORIES: Category[] = [
  { id: 'limpeza', name: 'Limpeza', icon: 'cleaning_services' },
  { id: 'reparos', name: 'Reparos', icon: 'plumbing' },
  { id: 'beleza', name: 'Beleza', icon: 'spa' },
  { id: 'aulas', name: 'Aulas', icon: 'school' },
  { id: 'fretes', name: 'Fretes', icon: 'local_shipping' },
  { id: 'ti', name: 'T.I.', icon: 'computer' },
  { id: 'pet', name: 'Pet', icon: 'pets' },
  { id: 'barbearia', name: 'Barbearia', icon: 'content_cut' },
];

export const PROFESSIONALS: Professional[] = [
  {
    id: 'p1',
    name: 'Maria Silva',
    email: 'maria@example.com',
    role: 'professional',
    avatarInitial: 'M',
    favorites: [],
    createdAt: new Date().toISOString(),
    profession: 'Diarista & Especialista em Organização',
    description: 'Mais de 8 anos de experiência em limpeza residencial e empresarial.',
    categoryId: 'limpeza',
    avatarUrl: 'https://i.pravatar.cc/300',
    coverUrl: 'https://i.pravatar.cc/300',
    portfolio: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=300&fit=crop'
    ],
    rating: 4.9,
    reviewsCount: 148,
    verified: true,
    activeSubscription: true,
    location: 'São Paulo, SP',
    services: [
      { id: 's1-1', professionalId: 'p1', title: 'Faxina Completa', categoryId: 'Limpeza', price: 180, duration: '240' },
      { id: 's1-2', professionalId: 'p1', title: 'Limpeza Pós-Obra', categoryId: 'Limpeza', price: 320, duration: '360' },
    ],
  },
  {
    id: 'p4',
    name: 'Lucas Ferreira',
    email: 'lucas@example.com',
    role: 'professional',
    avatarInitial: 'L',
    favorites: [],
    createdAt: new Date().toISOString(),
    profession: 'Barbeiro & Visagista Masculino',
    description: 'Cortes modernos degradê, barba na toalha quente e alinhamento.',
    categoryId: 'barbearia',
    avatarUrl: 'https://i.pravatar.cc/300',
    coverUrl: 'https://i.pravatar.cc/300',
    portfolio: [
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=300&fit=crop'
    ],
    rating: 4.85,
    reviewsCount: 78,
    verified: true,
    activeSubscription: true,
    location: 'Curitiba, PR',
    services: [
      { id: 's4-1', professionalId: 'p4', title: 'Corte Degradê Fade', categoryId: 'Barbearia', price: 50, duration: '40' },
      { id: 's4-2', professionalId: 'p4', title: 'Barboterapia', categoryId: 'Barbearia', price: 45, duration: '35' },
    ],
  }
];

export const MOCK_REVIEWS: Review[] = [
  { id: 'r1', professionalId: 'p1', clientId: 'u101', clientName: 'Fernanda Rocha', rating: 5, text: 'A Maria foi incrível!', createdAt: '2026-08-10T14:30:00Z' },
  { id: 'r6', professionalId: 'p4', clientId: 'u106', clientName: 'Thiago Martins', rating: 5, text: 'Degradê na régua!', createdAt: '2026-08-22T18:00:00Z' },
];

export const MOCK_COUPONS: Coupon[] = [
  { id: 'c1', professionalId: 'p1', code: 'BEMVINDO20', discountPercent: 20, active: true },
  { id: 'c2', professionalId: 'p4', code: 'BARBA10', discountPercent: 10, active: true }
];

export const MOCK_CHATS: ChatMessage[] = [];

