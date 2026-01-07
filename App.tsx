import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Header } from './components/Header';
import { ChatBubble } from './components/ChatBubble';
import { PaymentPanel } from './components/PaymentPanel';
import { Dashboard } from './components/Dashboard';
import { getUserLocation, getCurrentTime } from './services/location';
import { trackEvent } from './services/tracking';
import { DIALOGUE, BASE_URL } from './constants';
import { ChatMessage, ButtonOption } from './types';

const BACKGROUND_IMAGE = 'https://i.pinimg.com/736x/56/ea/b7/56eab7512f1021bdd4cf04952ad45a2c.jpg';
const PROXY = "https://corsproxy.io/?";

const getSlug = () => window.location.pathname.replace('/painel', '').split('/').filter(p => p).pop() || 'home';

function App() {
  const isDashboard = window.location.pathname.endsWith('/painel') || window.location.pathname.endsWith('/painel/');
  
  if (isDashboard) {
    return <Dashboard />;
  }

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string>('START');
  const [typingStatus, setTypingStatus] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'text' | 'buttons' | 'none'>('none');
  const [activeOptions, setActiveOptions] = useState<ButtonOption[]>([]);
  const [locationData, setLocationData] = useState({ city: 'sua cidade', ddd: '11' });
  const [showPayment, setShowPayment] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [leadTracked, setLeadTracked] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedSteps = useRef<Set<string>>(new Set());
  const visitTracked = useRef(false);

  useEffect(() => {
    if (!visitTracked.current) {
      trackEvent('h1');
      getUserLocation().then(data => setLocationData(data));
      visitTracked.current = true;
    }
  }, []);

  useEffect(() => {
    if (processedSteps.current.has(currentStepId)) return;
    
    const step = DIALOGUE[currentStepId];
    if (!step) return;

    if (currentStepId === 'AWAITING_CITY') {
      trackEvent('h2');
    }

    if (step.action?.type === 'open_payment') {
      setShowPayment(true);
      trackEvent('h3');
      return;
    }

    const processMessages = async () => {
      processedSteps.current.add(currentStepId);
      
      if (step.messages) {
        for (const msg of step.messages) {
          setTypingStatus(msg.type === 'audio' ? 'gravando áudio...' : 'digitando...');
          await new Promise(resolve => setTimeout(resolve, msg.delay));
          
          const audioSrc = `${PROXY}${encodeURIComponent(BASE_URL + '/audios/notification.mp3')}`;
          new Audio(audioSrc).play().catch(() => {});

          let content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
          content = content.replace('{{city}}', locationData.city);

          const newMessage: ChatMessage = {
            id: Math.random().toString(36).substr(2, 9),
            isUser: false,
            type: msg.type,
            content,
            timestamp: getCurrentTime()
          };

          setMessages(prev => [...prev, newMessage]);
          
          if (!leadTracked && window.fbq && currentStepId === 'AWAITING_ENTER_CLUB') {
            window.fbq('track', 'Lead', { content_name: getSlug() });
            setLeadTracked(true);
          }
        }
      }

      setTypingStatus(null);

      if (step.response) {
        if (step.response.type === 'continue' && step.response.next) {
          setCurrentStepId(step.response.next);
        } else if (step.response.type === 'buttons' && step.response.options) {
          setInputType('buttons');
          setActiveOptions(step.response.options);
        } else {
          setInputType('text');
        }
      }
    };

    processMessages();
  }, [currentStepId, locationData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingStatus]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      isUser: true,
      type: 'text',
      content: inputText,
      timestamp: getCurrentTime()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    if (DIALOGUE[currentStepId]?.response?.next) {
      setCurrentStepId(DIALOGUE[currentStepId].response.next);
      setInputType('none');
    }
  };

  const handleOptionClick = (option: ButtonOption) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      isUser: true,
      type: 'text',
      content: option.text,
      timestamp: getCurrentTime()
    };
    setMessages(prev => [...prev, userMsg]);
    setActiveOptions([]);
    setInputType('none');
    setCurrentStepId(option.next);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#0b141a] relative overflow-hidden">
      <Header status={typingStatus || "online"} />
      
      <div 
        className="flex-1 overflow-y-auto p-3 space-y-2 pb-32"
        style={{ 
          backgroundImage: `url("${BACKGROUND_IMAGE}")`,
          backgroundSize: '400px',
          backgroundRepeat: 'repeat'
        }}
      >
        {messages.map((msg) => (
          <ChatBubble 
            key={msg.id}
            {...msg}
            userCity={locationData.city}
            playingAudioId={playingAudioId}
            setPlayingAudioId={setPlayingAudioId}
          />
        ))}
        {typingStatus && (
          <div className="flex items-start mb-2 animate-fadeIn">
            <div className="bg-[#262d31] text-[#8696a0] p-2 px-4 rounded-full rounded-tl-none text-xs italic flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
              {typingStatus}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER FLUTUANTE (VOLTOU AO ORIGINAL PERFEITO) */}
      <div className="absolute bottom-0 left-0 right-0 p-2 z-30 bg-gradient-to-t from-[#0b141a] via-[#0b141a]/90 to-transparent">
        {inputType === 'buttons' && activeOptions.length > 0 && (
          <div className="flex flex-col gap-2 mb-3 animate-slideUp">
            {activeOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleOptionClick(opt)}
                className="w-full bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] font-bold py-3.5 rounded-xl border border-white/10 shadow-2xl active:scale-95 transition-all"
              >
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {inputType === 'text' && (
          <div className="flex items-center gap-2 bg-[#202c33] rounded-full px-4 py-2.5 shadow-2xl border border-white/5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Mensagem"
              className="flex-1 bg-transparent text-white outline-none text-[16px]"
              autoFocus
            />
            <button onClick={handleSendMessage} className="text-[#8696a0] active:text-[#00a884]">
              <Send size={24} />
            </button>
          </div>
        )}
      </div>

      {showPayment && (
        <PaymentPanel 
          userCity={locationData.city} 
          userDDD={locationData.ddd} 
        />
      )}
    </div>
  );
}

export default App;
