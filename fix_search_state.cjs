const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [viewMode, setViewMode] = useState<'list'|'map'>('list');",
  "const [viewMode, setViewMode] = useState<'list'|'map'>(loc.state?.view || 'list');\n  useEffect(() => {\n    if(loc.state?.view) setViewMode(loc.state.view);\n    if(loc.state?.filter) setFilter(loc.state.filter);\n    if(loc.state?.q !== undefined || loc.state?.category) setQ(loc.state.q || loc.state.category || '');\n  }, [loc.state]);"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Search state updated to listen to loc.state');
