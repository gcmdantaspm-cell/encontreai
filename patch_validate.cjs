const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexValidate = /if \(el\?\.value\.toUpperCase\(\) === confirmCode\) \{\s*updateStatus\(a\.id, 'completed'\);\s*if\(show\) show\('Código confirmado! 93% do valor foi creditado\.'\);\s*\}/;

const replacementValidate = `if (el?.value.toUpperCase() === confirmCode) {
   updateStatus(a.id, 'completed');
   
   // Credit the professional's wallet (93% of the value)
   const proRef = doc(db, 'users', user.id);
   getDoc(proRef).then(snap => {
     if(snap.exists()) {
        const data = snap.data();
        const currentBalance = data.walletBalance || 0;
        const newBalance = currentBalance + (a.price * 0.93);
        updateDoc(proRef, { walletBalance: newBalance });
     }
   });

   if(show) show('Código confirmado! O status foi alterado para Pagamento recebido e o valor foi para sua carteira.');
}`;

code = code.replace(regexValidate, replacementValidate);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed validate code');
