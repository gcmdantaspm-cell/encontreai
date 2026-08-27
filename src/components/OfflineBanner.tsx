import React, { useState, useEffect } from 'react';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-red-500 text-white text-sm font-bold p-2 text-center fixed top-0 w-full z-[9999] shadow-md flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-[18px]">wifi_off</span>
      Você está offline. Verifique sua conexão com a internet.
    </div>
  );
}
