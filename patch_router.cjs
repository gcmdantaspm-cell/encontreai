const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const routerOld = `            <Routes>
               <Route path="/" element={<Navigate to="/busca" />} />
               <Route path="/busca" element={<SearchScreen pros={pros} isDark={isDark} user={user} show={show} toggleFavorite={toggleFavorite} />} />`;

const routerNew = `            <Routes>
               <Route path="/" element={<Navigate to="/inicio" />} />
               <Route path="/inicio" element={<HomeScreen pros={pros} isDark={isDark} user={user} show={show} toggleFavorite={toggleFavorite} />} />
               <Route path="/busca" element={<SearchScreen pros={pros} isDark={isDark} user={user} show={show} toggleFavorite={toggleFavorite} />} />`;

code = code.replace(routerOld, routerNew);
fs.writeFileSync('src/App.tsx', code);
