const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. BottomBar: remove max-w-[448px], add md:hidden (if we have a sidebar)
code = code.replace(/<div className=\{\`w-full max-w-\[448px\] shrink-0 border-t flex justify-around/, '<div className={`w-full shrink-0 border-t flex justify-around lg:hidden');

// 2. AppContent wrapper: replace max-w-[448px] with max-w-7xl
code = code.replace(/<div className=\{\`w-full max-w-\[448px\] h-full relative flex flex-col overflow-hidden shadow-2xl/, '<div className={`w-full h-full relative flex flex-col overflow-hidden shadow-2xl');

// Wait, the parent of AppContent wrapper is:
// <div className={`flex justify-center h-screen h-[100dvh] overflow-hidden ${isDark ? 'bg-black' : 'bg-[#e7e8e9]'}`}>
// If we just remove max-w-[448px], it will be full width!
// Let's add lg:flex-row to the parent, and build a Sidebar.

// 3. Onboarding & Login max-w-[448px]
code = code.replace(/max-w-\[448px\] mx-auto/g, 'max-w-md w-full mx-auto');

// 4. ProDetailScreen fixed bottom-0 -> absolute bottom-0
code = code.replace(/fixed bottom-0 w-full max-w-\[448px\]/g, 'absolute bottom-0 w-full');

// 5. CheckoutModal fixed bottom-0 left-0 w-full max-w-[448px] -> absolute bottom-0 left-0 w-full
code = code.replace(/fixed bottom-0 left-0 w-full max-w-\[448px\]/g, 'absolute bottom-0 left-0 w-full');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed simple replacements');
