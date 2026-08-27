const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// EditProfileModal
code = code.replace(/<motion\.div initial=\{\{y:'100%'\}\} animate=\{\{y:0\}\} exit=\{\{y:'100%'\}\} className=\{\`fixed bottom-0 left-0 w-full rounded-t-3xl/g, '<motion.div initial={{y:\'100%\'}} animate={{y:0}} exit={{y:\'100%\'}} className={`fixed bottom-0 left-0 w-full md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-md md:rounded-3xl rounded-t-3xl');

// ReviewModal
code = code.replace(/<motion\.div initial=\{\{y:'100%'\}\} animate=\{\{y:0\}\} exit=\{\{y:'100%'\}\} className=\{\`fixed bottom-0 w-full max-w-\[448px\] rounded-t-3xl/g, '<motion.div initial={{y:\'100%\'}} animate={{y:0}} exit={{y:\'100%\'}} className={`fixed bottom-0 left-0 w-full md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-md md:rounded-3xl rounded-t-3xl');
// Wait, ReviewModal has `fixed bottom-0 w-full max-w-[448px]`. Let's just catch `fixed bottom-0` for any modal.

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed Modals');
