const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const loginWithGoogle = async () => {
    try { await signInWithPopup(auth, googleProvider); return { ok: true }; }
    catch (e: any) { return { ok: false, error: e.message }; }
  };
  const logout = () => fbSignOut(auth);`;

const replacementStr = `  const loginWithGoogle = async () => {
    try { await signInWithPopup(auth, googleProvider); return { ok: true }; }
    catch (e: any) { return { ok: false, error: e.message }; }
  };
  
  const loginWithEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch(e: any) {
      return { ok: false, error: e.message };
    }
  };

  const registerWithEmail = async (email, password, name) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = {
        id: res.user.uid,
        name: name || 'Usuário',
        email: email,
        role: 'pending',
        avatarInitial: (name || 'U')[0].toUpperCase(),
        favorites: [],
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', res.user.uid), newUser);
      return { ok: true };
    } catch(e: any) {
      return { ok: false, error: e.message };
    }
  };

  const logout = () => fbSignOut(auth);`;

code = code.replace(targetStr, replacementStr);
code = code.replace(/return \{ user, loading, authError, loginWithGoogle, logout, updateRole, updateProfile, toggleFavorite \};/, `return { user, loading, authError, loginWithGoogle, loginWithEmail, registerWithEmail, logout, updateRole, updateProfile, toggleFavorite };`);
fs.writeFileSync('src/App.tsx', code);
