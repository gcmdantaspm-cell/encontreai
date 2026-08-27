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
    name: 'Thiago Barbeiro',
    email: 'thiago@example.com',
    role: 'professional',
    avatarInitial: 'T',
    favorites: [],
    createdAt: new Date().toISOString(),
    profession: 'Barbeiro Clássico e Moderno',
    description: 'Especialista em cortes degradê, barba terapia e estilo moderno. Atendimento premium para homens que buscam o melhor visual.',
    categoryId: 'barbearia',
    avatarUrl: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=300&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop',
    ],
    rating: 4.9,
    reviewsCount: 120,
    verified: true,
    activeSubscription: true,
    location: 'São Paulo, SP',
    services: [
      { id: 's1-1', professionalId: 'p1', title: 'Corte Degradê', categoryId: 'barbearia', price: 50, duration: '40', description: 'Corte moderno com transição perfeita.' },
      { id: 's1-2', professionalId: 'p1', title: 'Barboterapia (Toalha Quente)', categoryId: 'barbearia', price: 45, duration: '30', description: 'Tratamento completo para a barba com toalha quente e óleos essenciais.' },
      { id: 's1-3', professionalId: 'p1', title: 'Combo Corte + Barba', categoryId: 'barbearia', price: 85, duration: '70', description: 'O pacote completo para sair com o visual em dia.' },
    ],
  },
  {
    id: 'p2',
    name: 'Luíza Manicure',
    email: 'luiza@example.com',
    role: 'professional',
    avatarInitial: 'L',
    favorites: [],
    createdAt: new Date().toISOString(),
    profession: 'Designer de Unhas',
    description: 'Trabalho com alongamento em gel, fibra de vidro e esmaltação em gel. Unhas perfeitas e duradouras.',
    categoryId: 'beleza',
    avatarUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=150&h=150&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=600&h=300&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1519014816548-bf5fe059c98b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop'
    ],
    rating: 4.8,
    reviewsCount: 85,
    verified: true,
    activeSubscription: true,
    location: 'Rio de Janeiro, RJ',
    services: [
      { id: 's2-1', professionalId: 'p2', title: 'Manicure Tradicional', categoryId: 'beleza', price: 35, duration: '60', description: 'Limpeza, cuticulagem e esmaltação simples.' },
      { id: 's2-2', professionalId: 'p2', title: 'Alongamento Fibra de Vidro', categoryId: 'beleza', price: 150, duration: '120', description: 'Alongamento resistente com aspecto natural.' },
      { id: 's2-3', professionalId: 'p2', title: 'Esmaltação em Gel', categoryId: 'beleza', price: 60, duration: '60', description: 'Esmaltação de longa duração, sem descascar.' },
    ],
  },
  {
    id: 'p3',
    name: 'João Carlos Barbearia',
    email: 'joaocarlos@example.com',
    role: 'professional',
    avatarInitial: 'J',
    favorites: [],
    createdAt: new Date().toISOString(),
    profession: 'Barbearia Vintage',
    description: 'Ambiente climatizado e atendimento diferenciado. Resgatando o clássico com um toque moderno.',
    categoryId: 'barbearia',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1588773950453-61fc53ba213b?w=600&h=300&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop'
    ],
    rating: 5.0,
    reviewsCount: 230,
    verified: true,
    activeSubscription: true,
    location: 'Curitiba, PR',
    services: [
      { id: 's3-1', professionalId: 'p3', title: 'Corte Clássico', categoryId: 'barbearia', price: 45, duration: '40', description: 'Corte executivo feito na tesoura.' },
      { id: 's3-2', professionalId: 'p3', title: 'Barba Modelada', categoryId: 'barbearia', price: 40, duration: '30', description: 'Modelagem de barba com navalha.' },
      { id: 's3-3', professionalId: 'p3', title: 'Platinado / Luzes', categoryId: 'barbearia', price: 120, duration: '90', description: 'Descoloração e tonalização dos fios.' },
    ],
  }
];

export const MOCK_REVIEWS: Review[] = [
  { id: 'r1', professionalId: 'p1', clientId: 'u101', clientName: 'Roberto Marcos', rating: 5, text: 'Melhor degradê que já fiz!', createdAt: '2026-08-10T14:30:00Z' },
  { id: 'r2', professionalId: 'p1', clientId: 'u102', clientName: 'Felipe Dias', rating: 5, text: 'Atendimento excelente.', createdAt: '2026-08-11T10:00:00Z' },
  { id: 'r3', professionalId: 'p2', clientId: 'u103', clientName: 'Ana Paula', rating: 5, text: 'Minhas unhas duraram 1 mês intactas!', createdAt: '2026-08-20T14:00:00Z' },
  { id: 'r4', professionalId: 'p3', clientId: 'u104', clientName: 'Carlos Eduardo', rating: 5, text: 'Ambiente muito maneiro e corte top.', createdAt: '2026-08-22T18:00:00Z' },
];

export const MOCK_COUPONS: Coupon[] = [];
export const MOCK_CHATS: ChatMessage[] = [];
`;

fs.writeFileSync('src/data.ts', code);
console.log('data.ts updated with realistic profiles.');
