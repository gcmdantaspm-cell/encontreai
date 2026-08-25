import { Category, Professional } from './types';

export const CATEGORIES: Category[] = [
  { id: 'c1', name: 'Limpeza', icon: 'Sparkles' },
  { id: 'c2', name: 'Reformas', icon: 'Hammer' },
  { id: 'c3', name: 'Tecnologia', icon: 'Monitor' },
  { id: 'c4', name: 'Barbearia', icon: 'Scissors' },
  { id: 'c5', name: 'Estética', icon: 'Flower2' },
  { id: 'c6', name: 'Sobrancelhas', icon: 'Eye' },
  { id: 'c7', name: 'Fretes', icon: 'Truck' },
  { id: 'c8', name: 'Montagem', icon: 'Wrench' },
];

export const PROFESSIONALS: Professional[] = [
  {
    id: 'p1',
    name: 'Maria Silva',
    profession: 'Diarista Especializada',
    categoryId: 'c1',
    rating: 5.0,
    reviewsCount: 124,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150',
    coverUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600&h=300',
    description: 'Especialista em limpeza profunda e organização de ambientes. Mais de 5 anos transformando lares.',
    verified: true,
    activeSubscription: true,
    portfolio: [],
    reviews: []
  },
  {
    id: 'p2',
    name: 'Carlos Mendes',
    profession: 'Eletricista Residencial',
    categoryId: 'c2',
    rating: 4.9,
    reviewsCount: 89,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
    coverUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600&h=300',
    description: 'Instalações elétricas seguras, troca de fiação e quadros de força.',
    verified: true,
    activeSubscription: true,
    portfolio: [],
    reviews: []
  },
  {
    id: 'p3',
    name: 'Ana Costa',
    profession: 'Design de Sobrancelhas',
    categoryId: 'c6',
    rating: 5.0,
    reviewsCount: 210,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
    coverUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600&h=300',
    description: 'Especialista em micropigmentação e design natural. Valorize seu olhar!',
    verified: true,
    activeSubscription: true,
    portfolio: [],
    reviews: []
  },
  {
    id: 'p4',
    name: 'Marcos Oliveira',
    profession: 'Barbeiro Clássico',
    categoryId: 'c4',
    rating: 4.8,
    reviewsCount: 45,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
    coverUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600&h=300',
    description: 'Cortes na tesoura, degradê e barba na toalha quente. Estilo e resenha garantidos.',
    verified: true,
    activeSubscription: true,
    portfolio: [],
    reviews: []
  }
];
