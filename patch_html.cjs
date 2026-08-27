const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(
  /<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" \/>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />'
);

fs.writeFileSync('index.html', code);
console.log('Fixed viewport');
