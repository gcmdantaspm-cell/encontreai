const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function OrdersScreen\(\{ user, pros, go, isDark, show \}: any\) \{\n  const \{ apts, updateStatus \} = useAppointments\(user\?\.id, user\?\.role\);\n  const \[filter, setFilter\] = useState\('all'\);/m;

const replacement = `function OrdersScreen({ user, pros, go, isDark, show }: any) {
  const { apts, updateStatus } = useAppointments(user?.id, user?.role);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if(params.get('payment') === 'success') {
       if(show) show('Pagamento confirmado com sucesso! Dinheiro retido.');
       // Clean up URL
       window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [show]);`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched OrdersScreen URL checking successfully");
} else {
  console.log("Regex didn't match OrdersScreen URL checking");
}
