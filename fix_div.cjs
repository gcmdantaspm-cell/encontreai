const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<\/button>\n          \)}\n        <\/div>\n      <\/motion\.div>\n    <\/g>/, '</button>\n          )}\n        </div>\n      </div>\n      </motion.div>\n    </>');

// Let's just use string replace around line 1589-1591
code = code.replace('          )}\n        </div>\n      </motion.div>\n    </>\n  )', '          )}\n        </div>\n        </div>\n      </motion.div>\n    </>\n  )');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed div');
