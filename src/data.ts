import { Professional, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Manutenção', icon: 'Wrench' },
  { id: '2', name: 'Beleza', icon: 'Scissors' },
  { id: '3', name: 'Limpeza', icon: 'Sparkles' },
  { id: '4', name: 'Tecnologia', icon: 'Laptop' },
  { id: '5', name: 'Aulas', icon: 'GraduationCap' },
  { id: '6', name: 'Fretes', icon: 'Truck' },
];

export const PROFESSIONALS: Professional[] = [
  {
    id: 'p1',
    name: 'Carlos Silva',
    profession: 'Eletricista Residencial',
    rating: 4.8,
    reviewsCount: 124,
    verified: true,
    activeSubscription: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=carlos',
    coverUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop',
    description: 'Eletricista com mais de 10 anos de experiência. Especialista em instalações, reparos e projetos elétricos residenciais. Atendimento rápido e com garantia de segurança.',
    portfolio: [
      'https://images.unsplash.com/photo-1544724569-5f546fd6f2b6?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=600&auto=format&fit=crop',
    ],
    reviews: [
      { id: 'r1', authorName: 'Mariana Costa', rating: 5, comment: 'Excelente profissional, resolveu o problema do quadro de luz rapidamente.', date: 'Há 2 dias' },
      { id: 'r2', authorName: 'João Pedro', rating: 4, comment: 'Muito bom, mas chegou um pouco atrasado. O serviço foi impecável.', date: 'Há 1 semana' }
    ]
  },
  {
    id: 'p2',
    name: 'Ana Souza',
    profession: 'Designer de Sobrancelhas',
    rating: 5.0,
    reviewsCount: 89,
    verified: true,
    activeSubscription: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=ana',
    coverUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1974&auto=format&fit=crop',
    description: 'Especialista em Micropigmentação e Design de sobrancelhas. Transformando olhares com naturalidade e técnica avançada.',
    portfolio: [
      'https://images.unsplash.com/photo-1512496015851-a1c8bc2611e9?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop',
    ],
    reviews: [
      { id: 'r3', authorName: 'Beatriz Lima', rating: 5, comment: 'Amei o resultado! Muito caprichosa e detalhista.', date: 'Há 3 dias' }
    ]
  },
  {
    id: 'p3',
    name: 'Roberto Nunes',
    profession: 'Encanador',
    rating: 4.6,
    reviewsCount: 210,
    verified: false,
    activeSubscription: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=roberto',
    coverUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2000&auto=format&fit=crop',
    description: 'Serviços hidráulicos em geral. Caça-vazamentos, desentupimentos e instalação de tubulações. Atendimento rápido e eficiente.',
    portfolio: [
      'https://images.unsplash.com/photo-1585644192666-3d239c05e197?q=80&w=600&auto=format&fit=crop'
    ],
    reviews: [
      { id: 'r4', authorName: 'Carlos Eduardo', rating: 4, comment: 'Serviço rápido e sem sujeira. Resolveu o vazamento no mesmo dia.', date: 'Há 1 mês' }
    ]
  },
  {
    id: 'p4',
    name: 'Juliana Mendes',
    profession: 'Suporte de TI',
    rating: 4.9,
    reviewsCount: 56,
    verified: true,
    activeSubscription: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=juliana',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
    description: 'Formatação, remoção de vírus, recuperação de dados e configuração de redes Wi-Fi. Atendimento remoto e presencial com horários flexíveis.',
    portfolio: [
      'https://images.unsplash.com/photo-1588508065123-287b28e01397?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop'
    ],
    reviews: [
      { id: 'r5', authorName: 'Fernando T.', rating: 5, comment: 'Salvou meus arquivos! Super recomendo, muito atenciosa.', date: 'Há 5 dias' }
    ]
  },
  {
    id: 'p5',
    name: 'Marcos Oliveira',
    profession: 'Professor de Inglês',
    rating: 4.7,
    reviewsCount: 38,
    verified: true,
    activeSubscription: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=marcos',
    coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2028&auto=format&fit=crop',
    description: 'Professor certificado com metodologia comunicativa. Aulas para iniciantes e avançados, focadas em conversação e gramática aplicada.',
    portfolio: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop',
    ],
    reviews: [
      { id: 'r6', authorName: 'Camila R.', rating: 5, comment: 'Aprendi mais em 2 meses com ele do que em 2 anos de escola!', date: 'Há 1 semana' }
    ]
  }
];
