const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function Icon\(\{ name, fill, size, className \}: \{ name: string; fill\?: boolean; size\?: number; className\?: string \}\) \{/;
const replacement = `function Icon({ name, fill, size, className, ...rest }: { name: string; fill?: boolean; size?: number; className?: string; [x: string]: any }) {`;

code = code.replace(regex, replacement);
code = code.replace(/<span className=\{\`material-symbols-rounded \$\{fill \? 'material-filled' : ''\} \$\{className\|\|''\}\`\}/g, `<span {...rest} className={\`material-symbols-rounded \${fill ? 'material-filled' : ''} \${className||''}\`}`);

fs.writeFileSync('src/App.tsx', code);
