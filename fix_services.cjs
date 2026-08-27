const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

// For Thiago Barbeiro
code = code.replace(
  "id: 's1-1', professionalId: 'p1', title: 'Corte Degradê', categoryId: 'barbearia', price: 50, duration: '40', description: 'Corte moderno com transição perfeita.'",
  "id: 's1-1', professionalId: 'p1', title: 'Corte Degradê', categoryId: 'barbearia', price: 50, duration: '40', description: 'Corte moderno com transição perfeita.', imageUrls: ['https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop']"
);
code = code.replace(
  "id: 's1-2', professionalId: 'p1', title: 'Barboterapia (Toalha Quente)', categoryId: 'barbearia', price: 45, duration: '30', description: 'Tratamento completo para a barba com toalha quente e óleos essenciais.'",
  "id: 's1-2', professionalId: 'p1', title: 'Barboterapia (Toalha Quente)', categoryId: 'barbearia', price: 45, duration: '30', description: 'Tratamento completo para a barba com toalha quente e óleos essenciais.', imageUrls: ['https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop']"
);
code = code.replace(
  "id: 's1-3', professionalId: 'p1', title: 'Combo Corte + Barba', categoryId: 'barbearia', price: 85, duration: '70', description: 'O pacote completo para sair com o visual em dia.'",
  "id: 's1-3', professionalId: 'p1', title: 'Combo Corte + Barba', categoryId: 'barbearia', price: 85, duration: '70', description: 'O pacote completo para sair com o visual em dia.', imageUrls: ['https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop']"
);

// For Luíza Manicure
code = code.replace(
  "id: 's2-1', professionalId: 'p2', title: 'Manicure Tradicional', categoryId: 'beleza', price: 35, duration: '60', description: 'Limpeza, cuticulagem e esmaltação simples.'",
  "id: 's2-1', professionalId: 'p2', title: 'Manicure Tradicional', categoryId: 'beleza', price: 35, duration: '60', description: 'Limpeza, cuticulagem e esmaltação simples.', imageUrls: ['https://images.unsplash.com/photo-1519014816548-bf5fe059c98b?w=400&h=300&fit=crop']"
);
code = code.replace(
  "id: 's2-2', professionalId: 'p2', title: 'Alongamento Fibra de Vidro', categoryId: 'beleza', price: 150, duration: '120', description: 'Alongamento resistente com aspecto natural.'",
  "id: 's2-2', professionalId: 'p2', title: 'Alongamento Fibra de Vidro', categoryId: 'beleza', price: 150, duration: '120', description: 'Alongamento resistente com aspecto natural.', imageUrls: ['https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop']"
);
code = code.replace(
  "id: 's2-3', professionalId: 'p2', title: 'Esmaltação em Gel', categoryId: 'beleza', price: 60, duration: '60', description: 'Esmaltação de longa duração, sem descascar.'",
  "id: 's2-3', professionalId: 'p2', title: 'Esmaltação em Gel', categoryId: 'beleza', price: 60, duration: '60', description: 'Esmaltação de longa duração, sem descascar.', imageUrls: ['https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&h=300&fit=crop']"
);

// For João Carlos Barbearia
code = code.replace(
  "id: 's3-1', professionalId: 'p3', title: 'Corte Clássico', categoryId: 'barbearia', price: 45, duration: '40', description: 'Corte executivo feito na tesoura.'",
  "id: 's3-1', professionalId: 'p3', title: 'Corte Clássico', categoryId: 'barbearia', price: 45, duration: '40', description: 'Corte executivo feito na tesoura.', imageUrls: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop']"
);
code = code.replace(
  "id: 's3-2', professionalId: 'p3', title: 'Barba Modelada', categoryId: 'barbearia', price: 40, duration: '30', description: 'Modelagem de barba com navalha.'",
  "id: 's3-2', professionalId: 'p3', title: 'Barba Modelada', categoryId: 'barbearia', price: 40, duration: '30', description: 'Modelagem de barba com navalha.', imageUrls: ['https://images.unsplash.com/photo-1588773950453-61fc53ba213b?w=400&h=300&fit=crop']"
);
code = code.replace(
  "id: 's3-3', professionalId: 'p3', title: 'Platinado / Luzes', categoryId: 'barbearia', price: 120, duration: '90', description: 'Descoloração e tonalização dos fios.'",
  "id: 's3-3', professionalId: 'p3', title: 'Platinado / Luzes', categoryId: 'barbearia', price: 120, duration: '90', description: 'Descoloração e tonalização dos fios.', imageUrls: ['https://images.unsplash.com/photo-1622286342686-7a93557e49ed?w=400&h=300&fit=crop']"
);

fs.writeFileSync('src/data.ts', code);
console.log('data.ts updated with image urls.');
