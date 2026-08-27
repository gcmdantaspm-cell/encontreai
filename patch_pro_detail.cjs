const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "onBook={(d:string, t:string)",
  "onBook={(d:string, t:string, addons:any[], recurrence:string)"
);

code = code.replace(
  "price: bookModal.price",
  "price: bookModal.price + (addons && addons.length > 0 ? addons.length * 15 : 0), addons, recurrence" // Simplification for mock purposes, but let's actually just calculate it or pass it.
);
// Wait, the price in BookingModal was calculated. Let's change onBook to receive the final price as well.
// Let's patch `BookingModal` again so `onBook` takes `totalPrice`.

