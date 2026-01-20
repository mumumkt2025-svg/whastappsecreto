
import React from 'react';
import { ChevronLeft, Video, Phone, MoreVertical } from 'lucide-react';

interface HeaderProps {
  status: string;
}

export const Header: React.FC<HeaderProps> = ({ status }) => {
  const imageUrl = "https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp";

  return (
    <div className="bg-[#202c33] text-white p-2.5 flex items-center justify-between z-20 shadow-sm shrink-0 border-b border-white/5">
      <div className="flex items-center gap-2">
        <button className="text-white">
          <ChevronLeft size={24} />
        </button>
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-700 cursor-pointer">
           <img src={imageUrl} alt="Thaisinha" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col ml-1 justify-center">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[16px] leading-tight">Thaisinha 😈</span>
          </div>
          <span className="text-[12px] leading-tight text-[#00a884] font-medium">
            {status}
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
