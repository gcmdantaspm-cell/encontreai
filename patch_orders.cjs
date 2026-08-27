const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const submitReview = async (rating: number, text: string) => {",
  `const submitReview = async (rating: number, text: string) => {
    if (user.role === 'professional') {
      await addDoc(collection(db, 'reviews'), {
        professionalId: user.id, clientId: reviewModal.clientId, professionalName: user.name, rating, text, createdAt: new Date().toISOString(), type: 'pro_to_client'
      });
      await updateDoc(doc(db, 'appointments', reviewModal.id), { proReviewed: true });
      const clientRef = doc(db, 'users', reviewModal.clientId);
      const clientSnap = await getDoc(clientRef);
      if(clientSnap.exists()) {
        const data = clientSnap.data();
        const currentRating = data.rating || 5; const count = data.reviewsCount || 0;
        const newCount = count + 1; const newRating = ((currentRating * count) + rating) / newCount;
        await updateDoc(clientRef, { rating: newRating, reviewsCount: newCount });
      }
      setReviewModal(null);
      show('Avaliação enviada ao cliente!');
      return;
    }`
);

// We need to add the Pro control to evaluate the client
code = code.replace(
  "{/* Client Controls */}",
  `{user.role === 'professional' && a.status === 'completed' && !a.proReviewed && (
                     <button onClick={()=>setReviewModal(a)} className="w-full mt-2 py-2 bg-[#f97316] text-black rounded-lg text-xs font-bold active:scale-95">Avaliar Cliente</button>
                   )}
                   {/* Client Controls */}`
);

// And update the review modal component signature
code = code.replace(
  "function ReviewModal({ a, onClose, onSubmit, isDark }: any) {",
  "function ReviewModal({ a, onClose, onSubmit, isDark, userRole }: any) {"
);

code = code.replace(
  "Como foi o serviço de {a.professionalName}?",
  "{userRole === 'professional' ? `Como foi o cliente ${a.clientName}?` : `Como foi o serviço de ${a.professionalName}?`}"
);

code = code.replace(
  "Avaliar Serviço",
  "{userRole === 'professional' ? 'Avaliar Cliente' : 'Avaliar Serviço'}"
);

code = code.replace(
  "<ReviewModal a={reviewModal} onClose={()=>setReviewModal(null)} onSubmit={submitReview} isDark={isDark} />",
  "<ReviewModal a={reviewModal} onClose={()=>setReviewModal(null)} onSubmit={submitReview} isDark={isDark} userRole={user.role} />"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched orders and review modal");
