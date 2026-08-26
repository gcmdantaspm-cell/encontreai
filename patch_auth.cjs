const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'const logout = () => fbSignOut(auth);',
  `const loginWithEmail = async (email: string, pass: string) => {
    try { await signInWithEmailAndPassword(auth, email, pass); return { ok: true }; }
    catch (e: any) { return { ok: false, error: e.message }; }
  };
  const registerWithEmail = async (email: string, pass: string, name: string, role: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser: AppUser = {
        id: cred.user.uid, name, email, role: role as UserRole,
        avatarInitial: name[0].toUpperCase(), favorites: [], createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', cred.user.uid), newUser);
      setUser(newUser);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  };
  const logout = () => fbSignOut(auth);`
);

code = code.replace(
  'return { user, loading, authError, loginWithGoogle, logout, updateRole, toggleFavorite, updateProfile };',
  'return { user, loading, authError, loginWithGoogle, loginWithEmail, registerWithEmail, logout, updateRole, toggleFavorite, updateProfile };'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched successfully");
