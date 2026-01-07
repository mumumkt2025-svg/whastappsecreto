import React from 'react';
import { AudioBubble } from './AudioBubble';
import { MessageType } from '../types';

interface ChatBubbleProps {
  id: string;
  type: MessageType;
  content: string | Record<string, unknown>;
  isUser: boolean;
  timestamp: string;
  userCity?: string;
  playingAudioId: string | null;
  setPlayingAudioId: (id: string | null) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  id, 
  type, 
  content, 
  isUser, 
  timestamp, 
  userCity,
  playingAudioId, 
  setPlayingAudioId 
}) => {
  
  if (type === 'audio') {
    if (isUser) return null; 
    return (
      <div className="flex mb-2 items-end justify-start">
        <div className="relative w-full max-w-[90%] sm:max-w-[400px]">
           <AudioBubble 
             id={id}
             src={content as string} 
             isUser={isUser} 
             playingAudioId={playingAudioId}
             setPlayingAudioId={setPlayingAudioId}
           />
        </div>
      </div>
    );
  }

  const isMedia = type === 'image' || type === 'gif' || type === 'image_with_location';
  
  let displayContent = content as string;
  let caption = "";
  
  if (type === 'image_with_location') {
     // Foto de mapa/localização de alta qualidade
     displayContent = "https://midia.jdfnu287h7dujn2jndjsifd.com/location_preview.webp"; 
     caption = `📍 Localização em tempo real (${userCity || 'Sua Cidade'})`;
  }

  const maxWidthClass = isMedia ? 'max-w-[85%]' : 'max-w-[85%]';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      {!isUser && !isMedia && (
        <img 
          src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" 
          alt="Avatar" 
          className="w-8 h-8 rounded-full mr-2 self-start mt-1"
        />
      )}

      <div
        className={`relative ${maxWidthClass} rounded-2xl shadow-sm text-[15px] leading-[1.4] ${
          isUser 
            ? 'bg-[#005c4b] text-white rounded-tr-none' 
            : 'bg-[#262d31] text-white rounded-tl-none'
        } ${isMedia ? 'p-1.5' : 'p-2 px-3'}`}
      >
        {isMedia ? (
          <div className="flex flex-col">
            <div className="rounded-xl overflow-hidden bg-[#181c1f] mb-1">
              <img 
                src={displayContent} 
                alt="Media" 
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>
            {caption && <div className="px-1 text-[13px] text-white/90 font-medium pb-1 flex items-center gap-1">{caption}</div>}
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{displayContent}</div>
        )}

        <div className={`text-[10px] text-white/50 text-right mt-1 flex justify-end items-center gap-1 ${isMedia ? 'absolute bottom-2 right-3 bg-black/30 px-1 rounded backdrop-blur-sm' : ''}`}>
          {timestamp}
          {isUser && (
            <span className="text-[#53bdeb]">
               <svg viewBox="0 0 16 11" height="11" width="16"><path fill="currentColor" d="M12.756,0.534c-0.211-0.229-0.564-0.239-0.787-0.012L5.808,6.852l-2.09-2.26c-0.222-0.24-0.598-0.252-0.835-0.027 c-0.237,0.225-0.25,0.602-0.027,0.842l2.5,2.704c0.111,0.12,0.267,0.186,0.428,0.183c0.162-0.003,0.315-0.076,0.419-0.2 l6.565-6.776C13.004,1.097,12.977,0.764,12.756,0.534z"></path></svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
