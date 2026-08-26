const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<Route path="\/perfil" element=\{\<ProfileScreen user=\{user\}.*?\/>\} \/>/;
const replacement = `
               <Route path="/perfil" element={<ProfileScreen user={user} isDark={isDark} logout={logout} loginWithGoogle={loginWithGoogle} toggleDarkMode={toggleDarkMode} updateProfile={updateProfile} show={show} />} />
               <Route path="/auth" element={<AuthScreen loginWithGoogle={loginWithGoogle} loginWithEmail={loginWithEmail} registerWithEmail={registerWithEmail} isDark={isDark} show={show} />} />
`;
code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
