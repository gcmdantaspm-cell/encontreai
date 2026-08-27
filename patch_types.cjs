const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  "role: UserRole;",
  "role: UserRole;\n  currentMode?: 'client' | 'professional';"
);

code = code.replace(
  "status: 'pending' | 'approved' | 'completed' | 'cancelled';",
  "status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'paid';"
);

code = code.replace(
  "createdAt: string;\n}",
  "createdAt: string;\n  type?: 'text' | 'proposal';\n  proposal?: { price: number; status: 'pending' | 'accepted' | 'rejected' | 'countered'; serviceId?: string; serviceTitle?: string; };\n}"
);

fs.writeFileSync('src/types.ts', code);
console.log("Patched types.ts");
