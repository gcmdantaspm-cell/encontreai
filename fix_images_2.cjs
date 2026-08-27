const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<img src=\{s\.pro\.avatarUrl\}/g,
  '<img src={s.pro?.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"}'
);

code = code.replace(
  /<img src=\{pro\.avatarUrl\} /g,
  '<img src={pro?.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"} '
);

code = code.replace(
  /<img src=\{svc\.pro\.avatarUrl\} /g,
  '<img src={svc?.pro?.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"} '
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed more broken images');
