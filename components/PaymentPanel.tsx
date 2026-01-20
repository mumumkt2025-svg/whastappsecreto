
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Copy, CheckCircle, Loader2, VolumeX, ShieldCheck, ChevronLeft, TrendingUp, Users, MoreVertical, Video, Phone, Mic, Info, Play } from 'lucide-react';
import { trackEvent } from '../services/tracking';

const GGPIX_API_KEY = "gk_bd4a27e1ea571c80d04fbad41535c62a8e960cfbc1744e4e";
const GGPIX_BASE_URL = "https://ggpixapi.com/api/v1/pix/in";
const GGPIX_STATUS_URL = "https://ggpixapi.com/api/v1/pix/out";
const PROXY = "https://corsproxy.io/?";

interface PaymentPanelProps {
  userCity: string;
  userDDD: string;
}

type Step = 'group_invite' | 'group_chat_sim' | 'intro' | 'qr1' | 'upsell' | 'qr2' | 'success';

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ userCity, userDDD }) => {
  const [step, setStep] = useState<Step>('group_invite');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [copyText, setCopyText] = useState('Copiar código PIX');
  const [showVslOverlay, setShowVslOverlay] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [isThaisinhaTyping, setIsThaisinhaTyping] = useState(false);
  
  const vslVideoRef = useRef<HTMLVideoElement>(null);
  const tutorialVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mensagens memorizadas para evitar erros de renderização
  const simMessages = useMemo(() => [
    { name: "+55 19 94238-9726", text: "Meu corninho nao para de me ligar gente, afff", time: "14:02", color: "#00a884" },
    { name: "+55 19 94238-9726", text: "Vou fazer ele esperar, olha como eu to agora gente", time: "14:02", color: "#00a884" },
    { name: "+55 19 94238-9726", image: "https://midia.jdfnu287h7dujn2jndjsifd.com/IMG-20240925-211627.webp", time: "14:02", color: "#00a884" },
    { name: "+55 19 92450-9675", text: "O meu ja adestrei, pica nova todo dia kkk", time: "14:03", color: "#34b7f1" },
    { name: "+55 19 94096-7607", text: `Genteee, o Paulo que entrou ontem me comeu tao bem aqui em ${userCity}`, time: "14:05", color: "#a75cf2" }
  ], [userCity]);

  // Lógica da Simulação
  useEffect(() => {
    if (step === 'group_chat_sim') {
      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx < simMessages.length) {
          const nextMsg = simMessages[currentIdx];
          if (nextMsg) {
            setVisibleMessages(prev => [...prev, nextMsg]);
          }
          currentIdx++;
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setIsThaisinhaTyping(true);
            setTimeout(() => {
              setIsThaisinhaTyping(false);
              setStep('intro');
            }, 3500);
          }, 1500);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step, simMessages]);

  // Lógica de Status do PIX
  useEffect(() => {
    let interval: any;
    if ((step === 'qr1' || step === 'qr2') && pixData?.id) {
      interval = setInterval(async () => {
        try {
          const url = `${PROXY}${encodeURIComponent(`${GGPIX_STATUS_URL}/${pixData.id}`)}`;
          const response = await fetch(url, { headers: { 'X-API-Key': GGPIX_API_KEY } });
          const data = await response.json();
          if (data.status === 'paid' || data.status === 'completed') {
            clearInterval(interval);
            if (step === 'qr1') {
              setStep('upsell');
              setPixData(null);
            } else {
              setStep('success');
            }
          }
        } catch (e) { /* Falha silenciosa para evitar crashes */ }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step, pixData]);

  const handleGeneratePix = async (amountCents: number, nextStep: Step) => {
    setLoading(true);
    const urlWithProxy = `${PROXY}${encodeURIComponent(GGPIX_BASE_URL)}`;
    try {
      const response = await fetch(urlWithProxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': GGPIX_API_KEY },
        body: JSON.stringify({
          amountCents,
          description: amountCents === 890 ? 'Acesso VIP Clube Secreto' : 'Pack Lives Gravadas',
          payerName: 'Participante do Clube',
          payerDocument: '52998224725', 
          externalId: `order_${Date.now()}`
        })
      });
      const data = await response.json();
      const code = data.pixCopyPaste || data.pixCode;
      if (code) {
        setPixData({ pix_code: code, id: data.id });
        setStep(nextStep);
        trackEvent(nextStep === 'qr1' ? 'h4' : 'h5');
      }
    } catch (err) { alert("Falha ao gerar PIX. Verifique sua conexão."); } finally { setLoading(false); }
  };

  const handleCopyPix = () => {
    if (!pixData?.pix_code) return;
    navigator.clipboard.writeText(pixData.pix_code);
    setCopyText('Copiado!');
    setTimeout(() => setCopyText('Copiar código PIX'), 2000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 1. TELA DE CONVITE
  if (step === 'group_invite') {
    return (
      <div className="fixed inset-0 z-50 bg-[#f0f2f5] flex flex-col animate-fadeIn">
        <div className="bg-[#00a884] h-32 w-full flex items-center justify-center p-4 relative">
           <img src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" className="w-24 h-24 rounded-full border-4 border-white shadow-lg translate-y-12 object-cover" alt="Perfil" />
        </div>
        <div className="flex-1 pt-16 px-6 flex flex-col items-center">
          <h2 className="text-xl font-bold text-[#414a4f] text-center mb-1 uppercase tracking-tight italic">🔥CLUBE SECRETO - {userCity.toUpperCase()}</h2>
          <p className="text-[#8696a0] text-sm mb-8 flex items-center gap-2">
            <Users size={16} className="text-[#00a884]" /> Grupo Privado · 987 participantes
          </p>
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm mb-10 shadow-sm border border-black/5 text-center">
            <p className="text-[#414a4f] text-[15px] leading-relaxed">
              Você recebeu um convite especial. <br/><br/> Entre agora no <span className="font-bold text-[#00a884]">Clube Secreto {userCity}</span> para ver os vídeos proibidos.
            </p>
          </div>
          <button onClick={() => setStep('group_chat_sim')} className="w-full max-w-sm bg-[#00a884] hover:bg-[#008f6f] text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-wider">
            Entrar no Grupo Agora 😈
          </button>
        </div>
      </div>
    );
  }

  // 2. TELA DE SIMULAÇÃO DO GRUPO
  if (step === 'group_chat_sim') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b141a] flex flex-col animate-fadeIn overflow-hidden">
        <div className="p-3 bg-[#202c33] flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <ChevronLeft size={24} className="text-white cursor-pointer" onClick={() => window.location.reload()} />
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
              <img src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" className="w-full h-full object-cover" alt="Perfil" />
            </div>
            <div>
              <h3 className="font-bold text-white text-[15px] leading-tight">🔥CLUBE SECRETO - {userCity}</h3>
              <p className="text-[11px] text-[#8696a0]">987 participantes online</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/70">
            <Video size={20} /><Phone size={18} /><MoreVertical size={20} />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ backgroundImage: `url('https://i.pinimg.com/736x/56/ea/b7/56eab7512f1021bdd4cf04952ad45a2c.jpg')`, backgroundSize: '400px', backgroundColor: '#0b141a' }}>
          {visibleMessages.map((msg, idx) => {
            if (!msg) return null;
            return (
              <div key={idx} className="flex flex-col items-start animate-slideUp">
                <div className="bg-[#202c33] p-2 px-3 rounded-xl rounded-tl-none max-w-[85%] shadow-md border-l-4" style={{ borderLeftColor: msg.color }}>
                  <p className="text-[11px] font-black uppercase mb-1" style={{ color: msg.color }}>{msg.name}</p>
                  {msg.text && <p className="text-white text-[14.5px] font-normal leading-relaxed">{msg.text}</p>}
                  {msg.image && <img src={msg.image} className="rounded-lg w-full mt-1 mb-1 border border-white/5" alt="Mídia" />}
                  <p className="text-[10px] text-white/30 text-right mt-1">{msg.time}</p>
                </div>
              </div>
            );
          })}
          {isThaisinhaTyping && (
            <div className="flex items-center gap-2 p-2 px-4 bg-[#202c33]/80 rounded-full w-fit animate-pulse border border-white/5">
              <Mic size={14} className="text-[#00a884]" />
              <span className="text-[#00a884] text-[11px] font-bold uppercase tracking-tighter">Thaisinha gravando áudio...</span>
            </div>
          )}
          <div ref={chatEndRef} className="h-4" />
        </div>
      </div>
    );
  }

  // 3. TELA DE SUCESSO FINAL
  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b141a] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="w-24 h-24 bg-[#00a884]/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-[#00a884]/10">
          <CheckCircle size={60} className="text-[#00a884]" />
        </div>
        <h2 className="text-3xl font-black text-white italic uppercase leading-tight tracking-tighter">ACESSO LIBERADO! 🔥</h2>
        <p className="text-[#8696a0] mt-3 mb-10 italic text-lg leading-snug">Seja bem-vindo(a) ao Clube! O seu link de acesso exclusivo ao grupo oficial já está pronto!</p>
        <button onClick={() => window.location.href = 'https://t.me/+exemplo'} className="w-full bg-[#00a884] hover:bg-[#00c298] text-white font-black py-5 rounded-2xl uppercase shadow-[0_10px_30px_rgba(0,168,132,0.4)] active:scale-95 transition-all text-xl">
          ENTRAR NO GRUPO AGORA 😈
        </button>
      </div>
    );
  }

  // 4. ESTRUTURA PRINCIPAL DE PAGAMENTO (VSL, QR, UPSELL)
  return (
    <div className="fixed inset-0 z-50 bg-[#0b141a] overflow-y-auto animate-fadeIn flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen bg-[#0b141a] pb-10 flex flex-col">
        {/* Header fixo de Pagamento */}
        <div className="p-4 bg-[#202c33] flex items-center gap-3 sticky top-0 z-50 border-b border-white/5 shadow-lg">
          <button onClick={() => setStep('group_chat_sim')} className="text-white"><ChevronLeft size={24} /></button>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
            <img src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" className="w-full h-full object-cover" alt="Perfil" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-sm uppercase tracking-tight italic">🔥CLUBE SECRETO - {userCity}</h3>
            <span className="text-[10px] text-[#00a884] flex items-center gap-1 uppercase font-black tracking-tighter italic">
              <ShieldCheck size={10} /> Pagamento 100% Seguro
            </span>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          {step === 'intro' && (
            <div className="space-y-6 animate-fadeIn flex flex-col flex-1">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black aspect-video border border-white/10 ring-1 ring-white/10">
                <video 
                  ref={vslVideoRef} 
                  src="https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/1110(4).mp4" 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                />
                {showVslOverlay && (
                  <div onClick={() => { if(vslVideoRef.current){vslVideoRef.current.muted=false; vslVideoRef.current.play(); setShowVslOverlay(false);}}} className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300">
                    <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,168,132,0.6)] scale-110">
                      <VolumeX size={40} className="text-white" />
                    </div>
                    <p className="text-white font-black mt-6 text-[13px] animate-pulse uppercase tracking-[0.2em] text-center px-4">Toque para ouvir a Thaisinha 🔊</p>
                  </div>
                )}
              </div>

              <div className="bg-[#202c33] p-8 rounded-[2.5rem] border border-white/5 text-center shadow-2xl mt-auto ring-1 ring-white/5">
                <div className="mb-4">
                  <span className="bg-[#00a884]/10 text-[#00a884] text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-[#00a884]/20 italic">Acesso Vitalício</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-2 italic uppercase leading-none tracking-tighter">QUASE LÁ, AMOR! 🔥</h2>
                <p className="text-[#8696a0] text-[15px] leading-relaxed mb-8 italic px-2">
                  Você está a um passo de ver todas as mídias proibidas. Pague apenas <span className="text-white font-black text-2xl drop-shadow-sm">R$ 8,90</span> e entre no grupo VIP agora.
                </p>
                <button 
                  onClick={() => handleGeneratePix(890, 'qr1')} 
                  disabled={loading} 
                  className="w-full bg-[#00a884] hover:bg-[#00c298] text-white font-black py-6 rounded-3xl flex items-center justify-center gap-3 uppercase shadow-[0_15px_30px_rgba(0,168,132,0.3)] active:scale-[0.97] transition-all text-xl italic"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'QUERO ENTRAR NO GRUPO ⚡'}
                </button>
              </div>
            </div>
          )}

          {(step === 'qr1' || step === 'qr2') && pixData && (
            <div className="flex flex-col items-center animate-fadeIn space-y-6">
              {/* Tutorial do PIX */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video w-full border border-white/5">
                <video 
                  ref={tutorialVideoRef} 
                  src="https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/tutorial-pix.mp4" 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                />
                <div onClick={() => { if(tutorialVideoRef.current){tutorialVideoRef.current.muted=false;}}} className="absolute top-3 right-3 bg-black/60 p-2 rounded-full cursor-pointer text-white">
                   <VolumeX size={20} />
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white p-5 rounded-[3rem] shadow-2xl border-[10px] border-[#00a884] w-full max-w-[280px] aspect-square flex items-center justify-center ring-4 ring-black/20">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixData.pix_code)}`} alt="QR Code" className="w-full h-full object-contain" />
              </div>
              
              <div className="text-center w-full">
                <div className="flex items-center justify-center gap-2 text-[#8696a0] text-[11px] uppercase font-black tracking-widest mb-1 italic">
                  <Loader2 size={12} className="animate-spin text-[#00a884]" /> Aguardando pagamento...
                </div>
                <p className="text-[#00a884] font-black text-5xl tabular-nums drop-shadow-md">{formatTime(timeLeft)}</p>
              </div>

              {/* Botão Copia e Cola */}
              <button onClick={handleCopyPix} className="w-full bg-[#202c33] text-white font-black py-5 rounded-3xl border border-white/10 flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-xl group italic">
                <Copy size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-xl uppercase tracking-wider">{copyText}</span>
              </button>
              
              <div className="flex items-center gap-3 text-[#8696a0] text-[10px] uppercase font-bold italic opacity-60 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                <ShieldCheck size={14} className="text-[#00a884]" /> Ambiente Seguro & Criptografado
              </div>
            </div>
          )}

          {step === 'upsell' && (
            <div className="text-center space-y-6 animate-fadeIn pt-6 flex flex-col flex-1">
              <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                <TrendingUp size={48} className="text-yellow-500 animate-bounce" />
              </div>
              <h2 className="text-4xl font-black text-white italic uppercase leading-none tracking-tighter">ESPERA, AMOR! 🔥</h2>
              <p className="text-[#8696a0] text-xl px-4 italic leading-tight">
                Acesso ao grupo confirmado! Mas você quer levar também meu <span className="text-white font-bold">Arquivo de Lives Gravadas</span> por apenas mais <span className="text-yellow-500 font-black text-4xl">R$ 9,90</span>?
              </p>
              <div className="bg-[#202c33] p-8 rounded-[2.5rem] border border-yellow-500/20 shadow-2xl mt-auto ring-1 ring-yellow-500/10">
                <button onClick={() => handleGeneratePix(990, 'qr2')} disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#0b141a] font-black py-6 rounded-2xl mb-6 text-2xl uppercase shadow-[0_10px_30px_rgba(234,179,8,0.4)] active:scale-[0.97] transition-all italic">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'SIM, QUERO TUDO! 😈'}
                </button>
                <button onClick={() => setStep('success')} className="text-[#8696a0] text-[11px] font-black uppercase tracking-widest underline underline-offset-8 opacity-40 hover:opacity-100 transition-all italic">Não, levar apenas o acesso básico</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
