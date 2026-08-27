const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<Route path="\/busca" element=\{<SearchScreen pros=\{pros\} isDark=\{isDark\} user=\{user\} show=\{show\} toggleFavorite=\{toggleFavorite\} \/>\} \/>/;
const replacement = `<Route path="/busca" element={<SearchScreen pros={pros} isDark={isDark} user={user} show={show} toggleFavorite={toggleFavorite} />} />
               <Route path="/pesquisa" element={<SearchScreen pros={pros} isDark={isDark} user={user} show={show} toggleFavorite={toggleFavorite} />} />`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Routes patched');
