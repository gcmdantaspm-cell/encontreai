const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex1 = /const \{ user, loading, authError, loginWithGoogle, logout, updateRole, toggleFavorite, updateProfile \} = useAuth\(\);/;
const replacement1 = `const { user, loading, authError, loginWithGoogle, loginWithEmail, registerWithEmail, logout, updateRole, toggleFavorite, updateProfile } = useAuth();`;

code = code.replace(regex1, replacement1);
fs.writeFileSync('src/App.tsx', code);
