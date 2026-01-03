import React from 'react';
import { AudioBubble } from './AudioBubble';
import { MessageType } from '../types';

interface ChatBubbleProps {
  id: string;
  type: MessageType;
  content: string | Record<string, unknown>;
  isUser: boolean;
  timestamp: string;
  playingAudioId: string | null;
  setPlayingAudioId: (id: string | null) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  id, 
  type, 
  content, 
  isUser, 
  timestamp, 
  playingAudioId, 
  setPlayingAudioId 
}) => {
  
  if (type === 'audio') {
    if (isUser) return null; 

    return (
      <div className="flex mb-2 items-end justify-start">
        {/* Audio bubble container */}
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
     displayContent = "https://picsum.photos/id/50/600/400"; 
     caption = "📍 Localização enviada";
  }

  // Width logic: Media gets almost full width on mobile (90%), text is slightly narrower (85%)
  const maxWidthClass = isMedia ? 'max-w-[90%] sm:max-w-[70%]' : 'max-w-[85%] sm:max-w-[65%]';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2.5`}>
      {!isUser && !isMedia && (
        <img 
          src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" 
          alt="Avatar" 
          className="w-[30px] h-[30px] rounded-full mr-2 flex-shrink-0 self-start mt-1"
        />
      )}

      <div
        className={`relative ${maxWidthClass} rounded-[18px] shadow-sm text-[14.5px] leading-[1.4] break-words ${
          isUser 
            ? 'bg-[#005c4b] text-white rounded-tr-none' 
            : 'bg-[#262d31] text-white rounded-tl-none'
        } ${isMedia ? 'p-1' : 'p-[8px] px-[12px]'}`}
      >
        {isMedia ? (
          <div className="flex flex-col">
            <div className="rounded-lg overflow-hidden bg-[#262D31] mb-1 w-full">
              {/* Image uses full width of the bubble container */}
              <img 
                src={displayContent} 
                alt="Media" 
                className="w-full h-auto object-cover block"
                loading="lazy"
              />
            </div>
            {caption && <div className="px-1 text-[13px] text-white/90 font-normal pb-0.5">{caption}</div>}
          </div>
        ) : (
          <div className="whitespace-pre-wrap">
            {displayContent}
          </div>
        )}

        <div className={`text-[10px] text-[hsla(0,0%,100%,0.6)] text-right mt-0.5 flex justify-end items-center gap-1 ${isMedia ? 'px-1.5 pb-0.5 absolute bottom-2 right-2 drop-shadow-md bg-black/20 rounded-md px-1' : ''}`}>
          {timestamp}
          {isUser && (
            <span className="text-[#53bdeb]">
               <svg viewBox="0 0 16 11" height="11" width="16" version="1.1">
                  <path fill="currentColor" d="M12.756,0.534c-0.211-0.229-0.564-0.239-0.787-0.012L5.808,6.852l-2.09-2.26c-0.222-0.24-0.598-0.252-0.835-0.027 c-0.237,0.225-0.25,0.602-0.027,0.842l2.5,2.704c0.111,0.12,0.267,0.186,0.428,0.183c0.162-0.003,0.315-0.076,0.419-0.2 l6.565-6.776C13.004,1.097,12.977,0.764,12.756,0.534z"></path>
                  <path fill="currentColor" d="M11.667,0.534c-0.211-0.229-0.564-0.239-0.787-0.012l-5.072,5.235l-0.391-0.423C5.645,5.553,5.925,5.772,6.036,6.01 l4.845-5.002C11.129,0.766,11.417,0.536,11.667,0.534z"></path>
               </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};