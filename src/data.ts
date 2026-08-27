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

export const PROFESSIONALS: any[] = [
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
      { id: 's1-1', professionalId: 'p1', title: 'Corte Degradê', categoryId: 'barbearia', price: 50, duration: '40', description: 'Corte moderno com transição perfeita.', imageUrls: ['https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop'] },
      { id: 's1-2', professionalId: 'p1', title: 'Barboterapia (Toalha Quente)', categoryId: 'barbearia', price: 45, duration: '30', description: 'Tratamento completo para a barba com toalha quente e óleos essenciais.', imageUrls: ['https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop'] },
      { id: 's1-3', professionalId: 'p1', title: 'Combo Corte + Barba', categoryId: 'barbearia', price: 85, duration: '70', description: 'O pacote completo para sair com o visual em dia.', imageUrls: ['https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop'] },
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
      { id: 's2-1', professionalId: 'p2', title: 'Manicure Tradicional', categoryId: 'beleza', price: 35, duration: '60', description: 'Limpeza, cuticulagem e esmaltação simples.', imageUrls: ['https://images.unsplash.com/photo-1519014816548-bf5fe059c98b?w=400&h=300&fit=crop'] },
      { id: 's2-2', professionalId: 'p2', title: 'Alongamento Fibra de Vidro', categoryId: 'beleza', price: 150, duration: '120', description: 'Alongamento resistente com aspecto natural.', imageUrls: ['https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop'] },
      { id: 's2-3', professionalId: 'p2', title: 'Esmaltação em Gel', categoryId: 'beleza', price: 60, duration: '60', description: 'Esmaltação de longa duração, sem descascar.', imageUrls: ['https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&h=300&fit=crop'] },
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
      { id: 's3-1', professionalId: 'p3', title: 'Corte Clássico', categoryId: 'barbearia', price: 45, duration: '40', description: 'Corte executivo feito na tesoura.', imageUrls: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop'] },
      { id: 's3-2', professionalId: 'p3', title: 'Barba Modelada', categoryId: 'barbearia', price: 40, duration: '30', description: 'Modelagem de barba com navalha.', imageUrls: ['https://images.unsplash.com/photo-1588773950453-61fc53ba213b?w=400&h=300&fit=crop'] },
      { id: 's3-3', professionalId: 'p3', title: 'Platinado / Luzes', categoryId: 'barbearia', price: 120, duration: '90', description: 'Descoloração e tonalização dos fios.', imageUrls: ['https://images.unsplash.com/photo-1622286342686-7a93557e49ed?w=400&h=300&fit=crop'] },
    ],
  }
,

  {
    id: 'p4',
    name: 'Maria Faxina',
    email: 'maria@example.com',
    profession: 'Diarista',
    rating: 4.8,
    reviewsCount: 45,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=400&fit=crop',
    description: 'Deixo sua casa brilhando! Profissional ágil, pontual e detalhista.',
    region: 'Zona Sul, SP',
    verified: true,
    location: 'São Paulo, SP',
    services: [
      { id: 's4-1', professionalId: 'p4', title: 'Faxina Completa', categoryId: 'limpeza', price: 150, duration: '240', description: 'Limpeza pesada de todos os cômodos.', imageUrls: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop'] },
      { id: 's4-2', professionalId: 'p4', title: 'Limpeza Pós-Obra', categoryId: 'limpeza', price: 300, duration: '480', description: 'Remoção de poeira e resíduos de reforma.', imageUrls: ['https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=300&fit=crop'] }
    ]
  },
  {
    id: 'p5',
    name: 'Carlos Encanador',
    email: 'carlos@example.com',
    profession: 'Bombeiro Hidráulico',
    rating: 4.9,
    reviewsCount: 30,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=400&fit=crop',
    description: 'Resolvo vazamentos e instalações hidráulicas com eficiência e rapidez.',
    region: 'Centro, RJ',
    verified: true,
    location: 'Rio de Janeiro, RJ',
    services: [
      { id: 's5-1', professionalId: 'p5', title: 'Caça Vazamento', categoryId: 'reparos', price: 120, duration: '60', description: 'Identificação de vazamentos ocultos.', imageUrls: ['https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop'] },
      { id: 's5-2', professionalId: 'p5', title: 'Instalação de Torneira', categoryId: 'reparos', price: 80, duration: '30', description: 'Troca ou instalação de torneiras e registros.', imageUrls: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop'] }
    ]
  },
  {
    id: 'p6',
    name: 'Prof. Alberto (Inglês)',
    email: 'alberto@example.com',
    profession: 'Professor Particular',
    rating: 5.0,
    reviewsCount: 22,
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop',
    description: 'Aulas de inglês dinâmicas, focadas em conversação e destravamento.',
    region: 'Online',
    verified: false,
    location: 'Online',
    services: [
      { id: 's6-1', professionalId: 'p6', title: 'Aula de Conversação', categoryId: 'aulas', price: 60, duration: '60', description: 'Prática intensa de speaking para todos os níveis.', imageUrls: ['https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&h=300&fit=crop'] },
      { id: 's6-2', professionalId: 'p6', title: 'Pacote Mensal (4 Aulas)', categoryId: 'aulas', price: 200, duration: '240', description: 'Pacote com desconto para 1 aula semanal.', imageUrls: ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop'] }
    ]
  },
  {
    id: 'p7',
    name: 'Roberto Carretos',
    email: 'roberto@example.com',
    profession: 'Motorista de Frete',
    rating: 4.7,
    reviewsCount: 88,
    avatarUrl: 'https://images.unsplash.com/photo-1543132220-4bf5de6d5315?w=150&h=150&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&h=400&fit=crop',
    description: 'Transporte seguro de móveis e encomendas para toda a região metropolitana.',
    region: 'Grande BH',
    verified: true,
    location: 'Belo Horizonte, MG',
    services: [
      { id: 's7-1', professionalId: 'p7', title: 'Frete Básico (Kombi)', categoryId: 'fretes', price: 100, duration: '60', description: 'Transporte rápido de pequenos volumes.', imageUrls: ['https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&h=300&fit=crop'] },
      { id: 's7-2', professionalId: 'p7', title: 'Mudança Completa (Caminhão)', categoryId: 'fretes', price: 600, duration: '300', description: 'Caminhão baú e ajudantes para mudança.', imageUrls: ['https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop'] }
    ]
  },
  {
    id: 'p8',
    name: 'Ana Tech',
    email: 'ana@example.com',
    profession: 'Técnica de Informática',
    rating: 4.9,
    reviewsCount: 56,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1597872253359-fdf4e15e6333?w=800&h=400&fit=crop',
    description: 'Manutenção de computadores, formatação e remoção de vírus. Serviço rápido.',
    region: 'Zona Norte, SP',
    verified: true,
    location: 'São Paulo, SP',
    services: [
      { id: 's8-1', professionalId: 'p8', title: 'Formatação de PC', categoryId: 'ti', price: 100, duration: '120', description: 'Formatação com backup de até 100GB.', imageUrls: ['https://images.unsplash.com/photo-1597872253359-fdf4e15e6333?w=400&h=300&fit=crop'] },
      { id: 's8-2', professionalId: 'p8', title: 'Limpeza Interna', categoryId: 'ti', price: 80, duration: '60', description: 'Limpeza de hardware e troca de pasta térmica.', imageUrls: ['https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=400&h=300&fit=crop'] }
    ]
  },
  {
    id: 'p9',
    name: 'Bia Pet Sitter',
    email: 'bia@example.com',
    profession: 'Passeadora e Cuidadora',
    rating: 5.0,
    reviewsCount: 110,
    avatarUrl: 'https://images.unsplash.com/photo-1554727242-741c14fa561c?w=150&h=150&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=400&fit=crop',
    description: 'Amo animais! Cuidarei do seu pet como se fosse meu.',
    region: 'Zona Sul, SP',
    verified: true,
    location: 'São Paulo, SP',
    services: [
      { id: 's9-1', professionalId: 'p9', title: 'Passeio (1h)', categoryId: 'pet', price: 40, duration: '60', description: 'Passeio recreativo para gastar energia.', imageUrls: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop'] },
      { id: 's9-2', professionalId: 'p9', title: 'Pet Sitter (Diária)', categoryId: 'pet', price: 120, duration: '1440', description: 'Visitas em domicílio ou hospedagem familiar.', imageUrls: ['https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=400&h=300&fit=crop'] }
    ]
  }

];

export const MOCK_REVIEWS: Review[] = [
  { id: 'r1', professionalId: 'p1', clientId: 'u101', clientName: 'Roberto Marcos', rating: 5, text: 'Melhor degradê que já fiz!', createdAt: '2026-08-10T14:30:00Z' },
  { id: 'r2', professionalId: 'p1', clientId: 'u102', clientName: 'Felipe Dias', rating: 5, text: 'Atendimento excelente.', createdAt: '2026-08-11T10:00:00Z' },
  { id: 'r3', professionalId: 'p2', clientId: 'u103', clientName: 'Ana Paula', rating: 5, text: 'Minhas unhas duraram 1 mês intactas!', createdAt: '2026-08-20T14:00:00Z' },
  { id: 'r4', professionalId: 'p3', clientId: 'u104', clientName: 'Carlos Eduardo', rating: 5, text: 'Ambiente muito maneiro e corte top.', createdAt: '2026-08-22T18:00:00Z' },
];

export const MOCK_COUPONS: Coupon[] = [];
export const MOCK_CHATS: any[] = [,

  { id: 'r5', professionalId: 'p4', clientId: 'u105', clientName: 'Sônia G.', rating: 5, text: 'Muito caprichosa, minha casa ficou brilhando!', createdAt: '2026-08-25T14:30:00Z' },
  { id: 'r6', professionalId: 'p5', clientId: 'u106', clientName: 'Bruno M.', rating: 4, text: 'Rápido e objetivo, consertou o vazamento.', createdAt: '2026-08-24T10:00:00Z' },
  { id: 'r7', professionalId: 'p6', clientId: 'u107', clientName: 'Camila K.', rating: 5, text: 'Aulas super dinâmicas, destravei meu speaking!', createdAt: '2026-08-23T14:00:00Z' },
  { id: 'r8', professionalId: 'p7', clientId: 'u108', clientName: 'Lucas T.', rating: 5, text: 'Chegou no horário e transportou tudo com cuidado.', createdAt: '2026-08-22T18:00:00Z' },
  { id: 'r9', professionalId: 'p8', clientId: 'u109', clientName: 'Mariana S.', rating: 5, text: 'Meu notebook ficou rápido como novo. Ótimo trabalho.', createdAt: '2026-08-21T18:00:00Z' },
  { id: 'r10', professionalId: 'p9', clientId: 'u110', clientName: 'Jorge D.', rating: 5, text: 'Bia é um amor com os cachorros, recomendo muito!', createdAt: '2026-08-20T18:00:00Z' },

];
