const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="absolute bottom-0 left-0 w-full bg-white dark:bg-\[#1e1e1e\] border-t border-gray-200 dark:border-\[#2a2a2a\] p-4 z-\[101\]">\s*<div className="flex justify-between items-center mb-3">/g, '<div className="absolute bottom-0 left-0 w-full bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#2a2a2a] p-4 z-[101] flex justify-center">\n          <div className="max-w-xl w-full">\n          <div className="flex justify-between items-center mb-3">');

code = code.replace(/Concluir Agendamento\s*<\/button>\s*\)\}\s*<\/div>/g, 'Concluir Agendamento\n            </button>\n          )}\n          </div>\n        </div>');

// Also need to add max-w-xl to the wrapper of the modal body
code = code.replace(/<div className="p-4">\s*<div className="bg-white dark:bg-\[#1e1e1e\] rounded-2xl border/g, '<div className="p-4 max-w-xl mx-auto w-full">\n          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed BookingModal center');
