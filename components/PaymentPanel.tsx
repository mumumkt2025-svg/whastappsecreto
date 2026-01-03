import React, { useState, useEffect, useRef } from 'react';
import { Copy, CheckCircle, Loader2, VolumeX, MoreVertical, Video, Phone, Mic, Paperclip, Smile } from 'lucide-react';
import { getCurrentTime } from '../services/location';

interface PaymentPanelProps {
  userCity: string;
  userDDD: string;
}

const PUSHINPAY_TOKEN = "58478|7AwBygGFcNpRNgAmU0HWZp3VhIbV1xLy22hYFTHt935a7cc7";

// Função auxiliar para pegar o slug atual
const getSlug = () => window.location.pathname.split('/').filter(p => p).pop() || 'home';

interface GroupMessage {
  id: number;
  phone: string;
  content?: string;
  media?: { type: 'image' | 'video', url: string };
  avatar?: string;
  time: string;
  isMe?: boolean;
  delay?: number;
}

const generatePhone = (ddd: string) => {
  const part1 = Math.floor(90000 + Math.random() * 9000);
  const part2 = Math.floor(1000 + Math.random() * 9000);
  return `+55 ${ddd} ${part1}-${part2}`;
};

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ userCity, userDDD }) => {
  const [displayedMessages, setDisplayedMessages] = useState<GroupMessage[]>([]);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'intro' | 'qr' | 'success'>('intro');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qrCodeBase64: string; copiaECola: string; paymentId: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); 
  const [copyText, setCopyText] = useState("Copiar código PIX");
  const [showRetentionPopup, setShowRetentionPopup] = useState(false);

  const vslVideoRef = useRef<HTMLVideoElement>(null);
  const tutorialVideoRef = useRef<HTMLVideoElement>(null);
  const [showVslOverlay, setShowVslOverlay] = useState(true);
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let currentMsgIndex = 0;

    const dynamicMessages: GroupMessage[] = [
      { id: 1, phone: generatePhone(userDDD), content: "Meu corninho nao para de me ligar gente, afff", avatar: "https://midia.jdfnu287h7dujn2jndjsifd.com/IMG-20230920-204325646464.webp", delay: 600, time: getCurrentTime() },
      { id: 2, phone: generatePhone(userDDD), content: "Vou fazer ele esperar, olha como eu to agora gente", avatar: "https://midia.jdfnu287h7dujn2jndjsifd.com/IMG-20230920-204325646464.webp", delay: 1500, time: getCurrentTime() },
      { id: 3, phone: generatePhone(userDDD), media: { type: 'image', url: "https://midia.jdfnu287h7dujn2jndjsifd.com/IMG-20240925-211627.webp" }, avatar: "https://midia.jdfnu287h7dujn2jndjsifd.com/IMG-20230920-204325646464.webp", delay: 1000, time: getCurrentTime() },
      { id: 4, phone: generatePhone(userDDD === '11' ? '21' : '11'), content: "O meu ja adestrei, pica nova todo dia kkk", avatar: "https://midia.jdfnu287h7dujn2jndjsifd.com/1718211968653.webp", delay: 2000, time: getCurrentTime() },
      { id: 5, phone: generatePhone(userDDD), content: "Genteee, o Paulo que entrou ontem me comeu tao bem", avatar: "https://midia.jdfnu287h7dujn2jndjsifd.com/1641853871190.webp", delay: 2000, time: getCurrentTime() }
    ];

    const processNextMessage = async () => {
      if (currentMsgIndex >= dynamicMessages.length) {
        timeoutId = setTimeout(() => setShowModal(true), 1500);
        return;
      }
      const msgData = dynamicMessages[currentMsgIndex];
      setIsTyping(msgData.phone);
      await new Promise(r => setTimeout(r, 1000));
      setIsTyping(null);
      setDisplayedMessages(prev => [...prev, { ...msgData, time: getCurrentTime() }]);
      currentMsgIndex++;
      timeoutId = setTimeout(processNextMessage, msgData.delay || 1000);
    };

    processNextMessage();
    return () => clearTimeout(timeoutId);
  }, [userDDD]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [displayedMessages, isTyping]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'qr' && pixData?.paymentId) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`https://api.pushinpay.com.br/api/transactions/${pixData.paymentId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${PUSHINPAY_TOKEN}`, 'Accept': 'application/json' }
          });
          if (!response.ok) return;
          const data = await response.json();
          if (data.status === 'paid') {
             setStep('success');
             clearInterval(interval);
             if (window.fbq) {
               window.fbq('track', 'Purchase', { 
                 value: 19.99, 
                 currency: 'BRL',
                 content_name: getSlug()
               });
             }
          }
        } catch (error) {}
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step, pixData]);

  useEffect(() => {
    if (step === 'qr' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const handleGeneratePix = async () => {
    setLoading(true);
    if (window.fbq) window.fbq('track', 'AddToCart', { value: 19.99, currency: 'BRL', content_name: getSlug() });

    try {
      const response = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PUSHINPAY_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: 1999 })
      });
      if (!response.ok) throw new Error("Erro na API");
      const data = await response.json();
      setPixData({
        paymentId: data.id,
        qrCodeBase64: data.qr_code_base64,
        copiaECola: data.qr_code
      });
      setStep('qr');
    } catch (error) { 
      alert("Erro ao gerar o PIX. Tente novamente."); 
    } finally { setLoading(false); }
  };

  const handleCopyPix = () => {
    if (pixData?.copiaECola) {
      navigator.clipboard.writeText(pixData.copiaECola);
      setCopyText("Copiado!");
      setTimeout(() => setCopyText("Copiar código PIX"), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex justify-center animate-fadeIn h-[100dvh]">
      <div className="w-full sm:max-w-[480px] bg-[#0b141a] flex flex-col h-full relative shadow-2xl">
        <div className="bg-[#1f2c34] px-4 py-2 flex items-center justify-between z-10 shrink-0 h-[60px]">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="text-[#d9dee0]">
               <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor"><path d="M12,4l1.4,1.4L7.8,11H20v2H7.8l5.6,5.6L12,20l-8-8L12,4z"></path></svg>
             </div>
             <div className="w-[40px] h-[40px] rounded-full overflow-hidden shrink-0">
               <img src="https://midia.jdfnu287h7dujn2jndjsifd.com/IMG-20240711-00350743535.webp" className="w-full h-full object-cover" />
             </div>
             <div className="flex flex-col justify-center overflow-hidden">
               <h1 className="text-[#e9edef] text-[16px] font-semibold leading-tight truncate">🔥CLUBE SECRETO - {userCity || "VIP"}</h1>
               <span className="text-[#8696a0] text-[12px] truncate">{isTyping ? `${isTyping} está digitando...` : `Ativo agora`}</span>
             </div>
          </div>
          <div className="flex items-center gap-4 text-[#d9dee0]">
            <Video size={22} /><Phone size={20} /><MoreVertical size={20} />
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3" style={{ backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`, backgroundSize: 'contain' }}>
          {displayedMessages.map((msg) => (
            <div key={msg.id} className="flex mb-3 justify-start animate-fadeIn">
              <img src={msg.avatar} className="w-[30px] h-[30px] rounded-full mr-2 self-start mt-1" />
              <div className="relative max-w-[85%] rounded-lg p-1.5 shadow-sm text-white bg-[#202c33]">
                <div className="text-[#53bdeb] text-[13px] font-medium px-1 mb-0.5 leading-tight">{msg.phone}</div>
                {msg.media && <img src={msg.media.url} className="w-full h-auto rounded mb-1" />}
                {msg.content && <div className="px-1 text-[15px]">{msg.content}</div>}
                <div className="text-[10px] text-white/60 text-right px-1">{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#202c33] p-2 flex items-center gap-2 shrink-0 h-[62px]">
          <div className="flex gap-4 px-2 text-[#8696a0]"><Smile /><Paperclip /></div>
          <div className="flex-1 bg-[#2a3942] rounded-lg h-[40px] flex items-center px-4"><span className="text-[#8696a0] text-[15px]">Mensagem</span></div>
          <div className="w-[45px] flex justify-center text-[#8696a0]"><Mic /></div>
        </div>
      </div>

      {showModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-50 flex items-end sm:items-center justify-center animate-fadeIn">
          <div className="w-full sm:max-w-[480px] bg-white sm:rounded-xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative animate-slideIn">
            <div className="overflow-y-auto p-4 sm:p-6">
              {step === 'intro' && (
                <div className="flex flex-col items-center gap-5">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                    <video ref={vslVideoRef} className="w-full h-full object-cover" src="https://pub-a47e1d95fa6d47dcbaf7d09537629b3b.r2.dev/vslgruposecreto.mp4" autoPlay muted loop playsInline onContextMenu={(e) => e.preventDefault()} />
                    {showVslOverlay && (
                      <div onClick={() => { if(vslVideoRef.current){vslVideoRef.current.muted=false; setShowVslOverlay(false);}}} className="absolute inset-0 bg-black/60 cursor-pointer flex justify-center items-center"><VolumeX className="w-10 h-10 text-white" /></div>
                    )}
                  </div>
                  <div className="text-center">
                      <h2 className="text-lg font-bold">🔥CLUBE SECRETO - {userCity || "VIP"}</h2>
                      <div className="my-2">
                        <span className="text-xl text-gray-400 line-through mr-2">R$ 29,99</span>
                        <span className="text-4xl font-bold text-gray-900">R$ 19,99</span>
                      </div>
                  </div>
                  <button onClick={handleGeneratePix} disabled={loading} className="w-full bg-[#16A349] text-white py-4 rounded-lg font-bold text-lg shadow-md active:scale-[0.98]">
                      {loading ? <Loader2 className="animate-spin mx-auto" /> : "QUERO MEU ACESSO AGORA"}
                  </button>
                </div>
              )}

              {step === 'qr' && pixData && (
                <div className="flex flex-col">
                   <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 bg-black">
                    <video ref={tutorialVideoRef} className="w-full h-full object-cover" src="https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/tutorial-pix.mp4" autoPlay muted loop playsInline />
                     {showTutorialOverlay && (
                        <div onClick={() => {if(tutorialVideoRef.current){tutorialVideoRef.current.muted=false; setShowTutorialOverlay(false);}}} className="absolute inset-0 bg-black/60 cursor-pointer flex justify-center items-center"><VolumeX className="w-10 h-10 text-white" /></div>
                     )}
                  </div>
                  <div className="flex flex-col items-center">
                     <p className="text-xl font-bold text-red-600 mb-2">{formatTime(timeLeft)} restantes</p>
                     <img src={pixData.qrCodeBase64} className="w-48 h-48 mb-4 border p-2 rounded" />
                     <textarea className="w-full p-2 bg-gray-100 rounded text-xs font-mono mb-4 h-16" readOnly value={pixData.copiaECola} />
                     <button onClick={handleCopyPix} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                        {copyText === "Copiado!" ? <CheckCircle size={20} /> : <Copy size={20} />}
                        {copyText}
                     </button>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center py-10">
                   <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                   <h2 className="text-2xl font-bold mb-2">ACESSO LIBERADO!</h2>
                   <a href="https://xgruposdeputaria.com/" target="_blank" className="w-full bg-[#16A349] text-white py-4 rounded-lg font-bold text-center animate-bounce">ENTRAR NO GRUPO</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRetentionPopup && !showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-8 rounded-2xl max-w-[380px] w-full text-center shadow-2xl">
            <h2 className="text-2xl font-black mb-4">ESPERA! 😢</h2>
            <p className="mb-6 font-medium">As meninas do grupo de {userCity || "sua região"} estão te esperando!</p>
            <button onClick={() => {setShowRetentionPopup(false); setShowModal(true);}} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold mb-4">🔥 QUERO ENTRAR AGORA</button>
            <button onClick={() => setShowRetentionPopup(false)} className="text-gray-400 underline">Não, quero perder essa chance</button>
          </div>
        </div>
      )}
    </div>
  );
};