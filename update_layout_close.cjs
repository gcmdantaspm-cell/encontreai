const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/\{!hideBottomNav && <BottomBar isDark=\{isDark\} \/>\}\s*<\/div>\s*<\/div>/, `{!hideBottomNav && <BottomBar isDark={isDark} />}
          </div>
        </div>
      </div>`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed main layout close');
