const fs = require('fs');

const code = `import { Category, Professional, Review, Coupon, ChatMessage } from './types';

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
    name: 'Mariana Costa',
    email: 'mariana@example.com',
    role: 'professional',
    avatarInitial: 'M',
    favorites: [],
    createdAt: new Date().toISOString(),
    profession: 'Personal Training',
    description: 'Specialized in functional training and personalized health plans for all ages.',
    categoryId: 'health',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=300&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop'
    ],
    rating: 5.0,
    reviewsCount: 148,
    verified: true,
    activeSubscription: true,
    location: 'São Paulo, SP',
    services: [
      { id: 's1-1', professionalId: 'p1', title: 'Personal Training', categoryId: 'health', price: 60, duration: '60', description: 'One-on-one personal training session tailored to your goals.' },
      { id: 's1-2', professionalId: 'p1', title: 'Nutritional Plan', categoryId: 'health', price: 120, duration: '0', description: 'Custom nutritional plan for a full month.' },
      { id: 's1-3', professionalId: 'p1', title: 'Group Bootcamp', categoryId: 'health', price: 30, duration: '60', description: 'Outdoor group functional training.' },
    ],
  },
  {
    id: 'p2',
    name: 'Roberto Almeida',
    email: 'roberto@example.com',
    role: 'professional',
    avatarInitial: 'R',
    favorites: [],
    createdAt: new Date().toISOString(),
    profession: 'Plumber & Handyman',
    description: 'Over 10 years of experience in residential maintenance, plumbing, and general fixes.',
    categoryId: 'home',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1581092921461-7d8a67d5302c?w=600&h=300&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=300&fit=crop'
    ],
    rating: 4.8,
    reviewsCount: 92,
    verified: true,
    activeSubscription: true,
    location: 'Rio de Janeiro, RJ',
    services: [
      { id: 's2-1', professionalId: 'p2', title: 'Plumbing Fix', categoryId: 'home', price: 150, duration: '120', description: 'General plumbing repairs and diagnostics.' },
      { id: 's2-2', professionalId: 'p2', title: 'Furniture Assembly', categoryId: 'home', price: 200, duration: '180', description: 'Assembly of any kind of flat-pack furniture.' },
      { id: 's2-3', professionalId: 'p2', title: 'Electrical Checkup', categoryId: 'home', price: 100, duration: '60', description: 'Basic electrical system verification.' },
    ],
  }
];

export const MOCK_REVIEWS: Review[] = [
  { id: 'r1', professionalId: 'p1', clientId: 'u101', clientName: 'Fernanda Rocha', rating: 5, text: 'Mariana is amazing!', createdAt: '2026-08-10T14:30:00Z' },
  { id: 'r2', professionalId: 'p2', clientId: 'u106', clientName: 'Thiago Martins', rating: 5, text: 'Fast and reliable!', createdAt: '2026-08-22T18:00:00Z' },
];

export const MOCK_COUPONS: Coupon[] = [];
export const MOCK_CHATS: ChatMessage[] = [];
`;
fs.writeFileSync('src/data.ts', code);
console.log('Patched data.ts');
