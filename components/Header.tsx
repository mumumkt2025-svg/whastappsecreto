
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Video, Phone, MoreVertical } from 'lucide-react';
import { getUserLocation } from '../services/location';

interface HeaderProps {
  status: string;
}

export const Header: React.FC<HeaderProps> = ({ status }) => {
  const [city, setCity] = useState('LOCAL DESCONHECIDO');
  const imageUrl = "https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp";

  useEffect(() => {
    getUserLocation().then(loc => setCity(loc.city.toUpperCase()));
  }, []);

  return (
    <div className="bg-[#202c33] text-white p-2.5 flex items-center justify-between z-20 shadow-sm shrink-0 border-b border-white/5">
      <div className="flex items-center gap-2">
        <button className="text-white">
          <ChevronLeft size={24} />
        </button>
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-700 cursor-pointer">
           <img src={imageUrl} alt="Clube" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col ml-1 justify-center max-w-[180px] sm:max-w-none">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[15px] leading-tight truncate">🔥CLUBE SECRETO - {city}</span>
          </div>
          <span className="text-[11px] leading-tight text-[#8696a0] truncate">
            +55 19 99554-7226, +55 19 99818-6442...
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-white/70 pr-2">
        <Video size={22} className="cursor-pointer" />
        <Phone size={20} className="cursor-pointer" />
        <MoreVertical size={22} className="cursor-pointer" />
      </div>
    </div>
  );
};
