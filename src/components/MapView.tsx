import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Professional } from '../types';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon for Dark Mode if needed, otherwise default is fine
const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function MapView({ pros, isDark }: { pros: Professional[], isDark: boolean }) {
  const navigate = useNavigate();
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [proLocations, setProLocations] = useState<{ pro: Professional, loc: [number, number] }[]>([]);

  useEffect(() => {
    // Filter pros with valid coordinates first
    const validPros = pros
      .filter(p => p.latitude && p.longitude)
      .map(pro => ({ pro, loc: [pro.latitude!, pro.longitude!] as [number, number] }));

    setProLocations(validPros);

    // Get user's actual location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn("Geolocation denied or error. Fallback to default (São Paulo).", err);
          setUserLoc([-23.5505, -46.6333]);
        }
      );
    } else {
      setUserLoc([-23.5505, -46.6333]);
    }
  }, [pros]);

  if (!userLoc) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f97316] mb-4"></div>
        <p>Obtendo sua localização...</p>
      </div>
    );
  }

  // Pick a tile layer depending on dark mode
  const tileUrl = isDark 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={userLoc} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url={tileUrl}
        />
        <MapUpdater center={userLoc} />
        
        {/* User Marker */}
        <Marker position={userLoc}>
          <Popup>Você está aqui</Popup>
        </Marker>

        {/* Pros Markers */}
        {proLocations.map((pl, idx) => (
          <Marker key={pl.pro.id || idx} position={pl.loc} icon={customIcon}>
            <Popup className={isDark ? 'dark-popup' : ''}>
              <div className="flex flex-col items-center text-center gap-2 p-1 min-w-[140px]">
                {pl.pro.avatarUrl ? (
                  <img src={pl.pro.avatarUrl} alt={pl.pro.name} className="w-12 h-12 rounded-full object-cover shadow-md" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shadow-md">
                    {pl.pro.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-gray-900 m-0 leading-tight">{pl.pro.name}</h4>
                  <p className="text-xs text-gray-500 m-0 mt-0.5">{pl.pro.profession}</p>
                </div>
                <div className="flex items-center gap-1 text-orange-500 text-xs font-bold mt-1">
                  <span className="material-symbols-outlined !text-[14px]">star</span>
                  {pl.pro.rating.toFixed(1)}
                </div>
                <button 
                  onClick={() => navigate(`/servico/${pl.pro.id}`)}
                  className="w-full mt-2 bg-[#f97316] text-white py-1.5 rounded-lg text-xs font-bold active:scale-95"
                >
                  Ver Perfil
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <style>{`
        .leaflet-container { font-family: inherit; }
        .dark-popup .leaflet-popup-content-wrapper, .dark-popup .leaflet-popup-tip {
          background-color: #27272a;
          color: white;
        }
        .dark-popup .leaflet-popup-content h4 { color: white; }
        .dark-popup .leaflet-popup-content p { color: #a1a1aa; }
        .leaflet-control-attribution a { color: #f97316 !important; }
      `}</style>
    </div>
  );
}
