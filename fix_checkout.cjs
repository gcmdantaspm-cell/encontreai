const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="p-4">\s*<h2 className="font-bold text-lg mb-4/g, '<div className="p-4 max-w-xl mx-auto w-full">\n          <h2 className="font-bold text-lg mb-4');

code = code.replace(/<div className="absolute bottom-0 left-0 w-full bg-white dark:bg-\[#1e1e1e\] border-t border-gray-200 dark:border-\[#2a2a2a\] p-4 z-\[101\]">\s*<button/g, '<div className="absolute bottom-0 left-0 w-full bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#2a2a2a] p-4 z-[101] flex justify-center">\n          <div className="max-w-xl w-full">\n          <button');

code = code.replace(/Pagar R\$ \{total\.toFixed\(2\)\}\s*<\/button>\s*<\/div>/g, 'Pagar R$ {total.toFixed(2)}\n          </button>\n          </div>\n        </div>');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed CheckoutModal center');
