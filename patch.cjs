const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const search = `                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight flex-1 pr-2">{s.title}</h3>
                    <span className=\`font-black text-lg \${isDark?'text-[#60a5fa]':'text-[#002a5d]'}\`>R$ {s.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={s.pro.avatarUrl} className="w-6 h-6 rounded-full object-cover border" />
                    <span className=\`text-sm font-semibold truncate \${isDark?'text-[#a1a1aa]':'text-gray-600'}\`>{s.pro.name}</span>
                    <div className="flex-1"></div>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#f97316]"><Icon name="star" size={14} fill/> {s.pro.rating.toFixed(1)}</span>
                  </div>
                </div>`;
const replace = `                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight flex-1 pr-2">{s.title}</h3>
                    <span className=\`font-black text-lg whitespace-nowrap \${isDark?'text-[#60a5fa]':'text-[#002a5d]'}\`>R$ {s.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <img src={s.pro.avatarUrl} className="w-5 h-5 rounded-full object-cover border" />
                    <span className=\`text-xs font-semibold truncate \${isDark?'text-[#a1a1aa]':'text-gray-500'}\`>por {s.pro.name}</span>
                    <div className="flex-1"></div>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-[#f97316]">
                      <Icon name="star" size={12} fill/> {s.pro.rating.toFixed(1)} 
                      <span className=\`font-normal ml-0.5 \${isDark?'text-gray-400':'text-gray-500'}\`>({s.pro.reviewsCount || 0})</span>
                    </span>
                  </div>
                  {s.pro.location && (
                    <div className=\`flex items-center gap-1 text-[11px] font-semibold \${isDark?'text-gray-400':'text-gray-500'}\`>
                      <Icon name="location_on" size={12} /> {s.pro.location}
                    </div>
                  )}
                </div>`;
fs.writeFileSync('src/App.tsx', code.replace(search, replace));
