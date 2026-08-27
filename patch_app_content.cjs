const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [currentRole, setCurrentRole] = useState(user?.role || 'client');",
  "const [currentRole, setCurrentRole] = useState(user?.currentMode || user?.role || 'client');"
);

code = code.replace(
  "useEffect(() => { if (user?.role) setCurrentRole(user.role); }, [user]);",
  "useEffect(() => { if (user) setCurrentRole(user.currentMode || user.role); }, [user?.currentMode, user?.role]);"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched AppContent successfully");
