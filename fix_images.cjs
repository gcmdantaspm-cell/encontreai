const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We will use a regex to replace the image tags for services, so they have a proper fallback string, not just undefined.
// E.g. || 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop'
code = code.replace(
  /<img src=\{s\.imageUrls\?\.\[0\] \|\| s\.imageUrl \|\| s\.pro\.avatarUrl\} className="w-full h-full object-cover" \/>/g,
  '<img src={s.imageUrls?.[0] || s.imageUrl || s.pro?.avatarUrl || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop"} className="w-full h-full object-cover" />'
);

code = code.replace(
  /<img src=\{s\.imageUrls\?\.\[0\] \|\| s\.imageUrl \|\| pro\.avatarUrl\} className="w-full h-full object-cover" \/>/g,
  '<img src={s.imageUrls?.[0] || s.imageUrl || pro.avatarUrl || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop"} className="w-full h-full object-cover" />'
);

code = code.replace(
  /<img src=\{pro\.avatarUrl\} className="w-full h-full object-cover" \/>/g,
  '<img src={pro.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"} className="w-full h-full object-cover" />'
);

code = code.replace(
  /<img src=\{pro\.avatarUrl\}\/>/g,
  '<img src={pro.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"}/>'
);

// Review comments: "Coloque os comentários nas avaliações"
// ReviewModal currently doesn't show comments anywhere else than ProDetail.
// But maybe the user just didn't have any reviews. With my new data.ts, we now have reviews with texts!

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed broken images');
