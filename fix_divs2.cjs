const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/       <\/div>\n    <\/div>\n  \)\n\}\n\nfunction NewServiceScreen/, `       </div>\n    </div>\n    </div>\n  )\n}\n\nfunction NewServiceScreen`);

code = code.replace(/      <\/div>\n    <\/div>\n  \)\n\}\n\nfunction ChatDetailScreen/, `      </div>\n    </div>\n    </div>\n  )\n}\n\nfunction ChatDetailScreen`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed divs again');
