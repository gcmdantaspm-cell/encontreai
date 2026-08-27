const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The file has:
//        </div>
//     </div>
//   )
// }
// function NewServiceScreen...

code = code.replace(/       <\/div>\r?\n    <\/div>\r?\n  \)\r?\n\}/, `       </div>\n    </div>\n    </div>\n  )\n}`);
code = code.replace(/      <\/div>\r?\n    <\/div>\r?\n  \)\r?\n\}/, `      </div>\n    </div>\n    </div>\n  )\n}`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed divs 3');
