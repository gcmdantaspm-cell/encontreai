const fs = require('fs');
let code = fs.readFileSync('src/components/Logo.tsx', 'utf8');

if (!code.includes('useNavigate')) {
  code = code.replace("import React from 'react';", "import React from 'react';\nimport { useNavigate } from 'react-router-dom';");
}

if (!code.includes('const navigate = useNavigate();')) {
  code = code.replace("const subtitleColor", "const subtitleColor = isDark ? '#a1a1aa' : '#64748b';\n  const navigate = useNavigate();\n");
}

code = code.replace('<div className={`flex items-center gap-2 ${className}`}>', '<div onClick={() => navigate(\'/\')} className={`flex items-center gap-2 cursor-pointer ${className}`}>');

fs.writeFileSync('src/components/Logo.tsx', code);
console.log("Patched Logo.tsx");
