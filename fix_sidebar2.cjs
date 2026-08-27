const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Use regex to replace each label
code = code.replace(/> Home/g, '> Início');
code = code.replace(/> Profile/g, '> Perfil');
code = code.replace(/> Professionals Near Me/g, '> Profissionais Perto de Mim');
code = code.replace(/> Categories/g, '> Categorias');
code = code.replace(/> Favorites/g, '> Favoritos');
code = code.replace(/> My Appointments/g, '> Meus Pedidos');
code = code.replace(/> Professional Mode/g, '> Modo Profissional');
code = code.replace(/> Settings/g, '> Configurações');
code = code.replace(/> Help & Support/g, '> Ajuda e Suporte');
code = code.replace(/'User Name'/g, "'Usuário'");

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Sidebar translated.');
