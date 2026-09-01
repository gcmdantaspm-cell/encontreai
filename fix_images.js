const fs = require('fs');
let data = fs.readFileSync('src/data.ts', 'utf8');
let counter = 1;
data = data.replace(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+[^'"]*/g, () => `https://picsum.photos/seed/${counter++}/400/300`);
fs.writeFileSync('src/data.ts', data);

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+[^'"]*/g, 'https://picsum.photos/400/300');
fs.writeFileSync('src/App.tsx', app);
console.log('Fixed images');
