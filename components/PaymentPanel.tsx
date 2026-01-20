
import React, { useState, useEffect, useRef } from 'react';
/* Added Info to the lucide-react imports */
import { Copy, CheckCircle, Loader2, VolumeX, ShieldCheck, ChevronLeft, TrendingUp, Users, MoreVertical, Video, Phone, Mic, Info } from 'lucide-react';
import { trackEvent } from '../services/tracking';

const GGPIX_API_KEY = "gk_bd4a27e1ea571c80d04fbad41535c62a8e960cfbc1744e4e";
const GGPIX_BASE_URL = "https://ggpixapi.com/api/v1/pix/in";
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
  const [copyText, setCopyText] = useState('Copiar Código PIX');
  const [showVslOverlay, setShowVslOverlay] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [isThaisinhaTyping, setIsThaisinhaTyping] = useState(false);
  
  const vslVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const simMessages = [
    { name: "+55 " + (userDDD || "11") + " 94238-9726", text: "Acabei de entrar, o conteúdo tá insano! 🔥", time: "14:02", color: "#00a884" },
    { name: "+55 19 99818-6442", text: "Gente, vale cada centavo. Thaisinha se superou kkkk", time: "14:03", color: "#34b7f1" },
    { name: "Marcos Oliveira", text: "O pix caiu e o link veio na hora. Top!", time: "14:04", color: "#ff8300" },
    { name: "Julia Santos", text: "Meu Deus, olha esse vídeo novo que ela postou... 😱🔥", time: "14:05", color: "#a75cf2" }
  ];

  // Efeito para simular as mensagens do grupo
  useEffect(() => {
    if (step === 'group_chat_sim') {
      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx < simMessages.length) {
          setVisibleMessages(prev => [...prev, simMessages[currentIdx]]);
          currentIdx++;
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setIsThaisinhaTyping(true);
            setTimeout(() => {
              setStep('intro');
            }, 3000);
          }, 1000);
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleGeneratePix = async (amountCents: number, nextStep: Step) => {
    setLoading(true);
    const urlWithProxy = `${PROXY}${encodeURIComponent(GGPIX_BASE_URL)}`;
    
    try {
      const response = await fetch(urlWithProxy, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': GGPIX_API_KEY
        },
        body: JSON.stringify({
          amountCents: amountCents,
          description: 'Acesso VIP Clube Secreto',
          payerName: 'Participante do Clube',
          payerDocument: '52998224725', 
          externalId: `order_${Math.random().toString(36).substr(2, 9)}`
        })
      });

      const data = await response.json();
      const code = data.pixCopyPaste || data.pixCode;
      
      if (code) {
        setPixData({ pix_code: code, id: data.id });
        setStep(nextStep);
        trackEvent(nextStep === 'qr1' ? 'h4' : 'h5');
      } else {
        alert("Erro ao gerar pagamento. Tente novamente.");
      }
    } catch (err) {
      alert("Falha na conexão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'qr1' || step === 'qr2') {
      const timer = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const handleCopyPix = () => {
    if (!pixData?.pix_code) return;
    navigator.clipboard.writeText(pixData.pix_code);
    setCopyText('Código Copiado!');
    setTimeout(() => setCopyText('Copiar Código PIX'), 2000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // TELA 1: CONVITE
  if (step === 'group_invite') {
    return (
      <div className="fixed inset-0 z-50 bg-[#f0f2f5] flex flex-col animate-fadeIn">
        <div className="bg-[#00a884] h-32 w-full flex items-center justify-center p-4">
           <img src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" className="w-24 h-24 rounded-full border-4 border-white shadow-lg translate-y-12 object-cover" />
        </div>
        <div className="flex-1 pt-16 px-6 flex flex-col items-center">
          <h2 className="text-xl font-bold text-[#414a4f] text-center mb-1 uppercase tracking-tight">🔥CLUBE SECRETO - {userCity.toUpperCase()}</h2>
          <p className="text-[#8696a0] text-sm mb-8 flex items-center gap-2">
            <Users size={16} className="text-[#00a884]" /> Grupo Privado · 987 participantes
          </p>
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm mb-10 shadow-sm border border-black/5 text-center">
            <p className="text-[#414a4f] text-[15px] leading-relaxed">
              Você recebeu um convite VIP para o grupo de <span className="font-bold">{userCity}</span>. <br/><br/> Entre agora para ver as mídias exclusivas.
            </p>
          </div>
          <button onClick={() => setStep('group_chat_sim')} className="w-full max-w-sm bg-[#00a884] text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all uppercase tracking-wide">
            Entrar no Grupo
          </button>
        </div>
      </div>
    );
  }

  // TELA 2: SIMULAÇÃO DE CHAT (Layout Dark do Zap)
  if (step === 'group_chat_sim') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b141a] flex flex-col animate-fadeIn overflow-hidden">
        {/* Header do Grupo */}
        <div className="p-3 bg-[#202c33] flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <ChevronLeft size={24} className="text-white" />
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
              <img src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-white text-[15px] leading-tight">🔥CLUBE SECRETO - {userCity}</h3>
              <p className="text-[11px] text-[#8696a0] truncate max-w-[180px]">Thaisinha, +55 {userDDD} 99554-7226, +55...</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/70">
            <Video size={20} />
            <Phone size={18} />
            <MoreVertical size={20} />
          </div>
        </div>

        {/* Área de Mensagens com Papel de Parede */}
        <div 
          className="flex-1 p-4 space-y-3 overflow-y-auto relative"
          style={{ 
            backgroundImage: `url('https://i.pinimg.com/736x/56/ea/b7/56eab7512f1021bdd4cf04952ad45a2c.jpg')`, 
            backgroundSize: '400px',
            backgroundColor: '#0b141a'
          }}
        >
          <div className="flex justify-center mb-6">
            <span className="bg-[#1f2c34] text-white/60 text-[10px] px-3 py-1 rounded-lg uppercase font-bold tracking-widest shadow-sm">Entrando no grupo...</span>
          </div>

          {visibleMessages.map((msg, idx) => (
            <div key={idx} className="flex flex-col items-start animate-slideUp">
              <div className="bg-[#202c33] p-2 px-3 rounded-xl rounded-tl-none max-w-[85%] shadow-md border-l-4 border-white/5" style={{ borderLeftColor: msg.color }}>
                <p className="text-[11px] font-black uppercase mb-1" style={{ color: msg.color }}>{msg.name}</p>
                <p className="text-white text-[14px] leading-relaxed">{msg.text}</p>
                <p className="text-[10px] text-white/30 text-right mt-1">{msg.time}</p>
              </div>
            </div>
          ))}

          {isThaisinhaTyping && (
            <div className="flex items-center gap-2 p-2 px-4 bg-[#202c33]/80 backdrop-blur-sm rounded-full w-fit animate-pulse border border-white/5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-[#00a884] text-[11px] font-black uppercase">Thaisinha gravando áudio...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Fake */}
        <div className="p-2 bg-[#202c33] flex items-center gap-2">
           <div className="flex-1 bg-[#2a3942] rounded-full h-11 flex items-center px-4 text-white/30 text-sm">
             Mensagem
           </div>
           <div className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center text-white">
             <Mic size={20} />
           </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b141a] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-[#00a884]/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <CheckCircle size={60} className="text-[#00a884]" />
        </div>
        <h2 className="text-2xl font-black text-white italic uppercase">Acesso Liberado! 🔥</h2>
        <p className="text-[#8696a0] mt-2 mb-8">Seu pagamento foi confirmado. Toque abaixo para entrar no grupo oficial.</p>
        <button onClick={() => window.location.href = 'https://t.me/+exemplo'} className="w-full bg-[#00a884] text-white font-black py-4 rounded-2xl uppercase shadow-lg shadow-[#00a884]/20 active:scale-95 transition-all">
          ENTRAR NO GRUPO AGORA 😈
        </button>
      </div>
    );
  }

  // TELA 3 EM DIANTE: VSL E PAGAMENTO (Layout Dark Premium)
  return (
    <div className="fixed inset-0 z-40 bg-[#0b141a] overflow-y-auto animate-slideUp">
      <div className="max-w-md mx-auto min-h-screen bg-[#0b141a] pb-10">
        <div className="p-4 bg-[#202c33] flex items-center gap-3 sticky top-0 z-50 border-b border-white/5">
          <button onClick={() => window.location.reload()} className="text-white"><ChevronLeft size={24} /></button>
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight text-sm">🔥CLUBE SECRETO - {userCity}</h3>
            <span className="text-[10px] text-[#00a884] flex items-center gap-1 uppercase font-black tracking-tighter"><ShieldCheck size={10} /> PAGAMENTO SEGURO VIA GGPIX</span>
          </div>
        </div>

        <div className="p-6">
          {step === 'intro' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-black aspect-video border border-white/10 ring-4 ring-white/5">
                <video ref={vslVideoRef} src="https://pub-a47e1d95fa6d47dcbaf7d09537629b3b.r2.dev/vslgruposecreto.mp4" className="w-full h-full object-cover" autoPlay muted loop playsInline />
                {showVslOverlay && (
                  <div onClick={() => { if(vslVideoRef.current){vslVideoRef.current.muted=false; vslVideoRef.current.play(); setShowVslOverlay(false);}}} className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center cursor-pointer group">
                    <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"><VolumeX size={40} className="text-white" /></div>
                    <p className="text-white font-black mt-6 text-sm animate-pulse uppercase tracking-widest">Toque para ouvir 🔊</p>
                  </div>
                )}
              </div>
              
              <div className="bg-[#202c33] p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Info size={40} className="text-white" /></div>
                <h2 className="text-2xl font-black text-white mb-3 italic uppercase leading-tight">VAGA LIBERADA! 😈</h2>
                <p className="text-[#8696a0] text-[15px] leading-relaxed mb-6">
                  Amor, para cobrir os custos do servidor e manter nossa privacidade, cobramos apenas <span className="text-white font-bold text-xl">R$ 8,90</span>. O acesso é enviado na hora.
                </p>
                <button onClick={() => handleGeneratePix(890, 'qr1')} disabled={loading} className="w-full bg-[#00a884] hover:bg-[#00c99d] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 uppercase text-lg">
                  {loading ? <Loader2 className="animate-spin" /> : 'QUERO MEU ACESSO AGORA ⚡'}
                </button>
              </div>
            </div>
          )}

          {(step === 'qr1' || step === 'qr2') && pixData && (
            <div className="flex flex-col items-center animate-fadeIn">
              <div className="bg-white p-5 rounded-[3rem] mb-10 shadow-2xl border-[6px] border-[#00a884] w-full max-w-[320px] aspect-square flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(pixData.pix_code)}`} 
                  alt="QR Code PIX" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://chart.googleapis.com/chart?chs=350x350&cht=qr&chl=${encodeURIComponent(pixData.pix_code)}`;
                  }}
                />
              </div>
              
              <div className="text-center mb-10">
                <p className="text-[#00a884] font-black text-6xl mb-2 tabular-nums">{formatTime(timeLeft)}</p>
                <div className="flex items-center gap-2 justify-center text-[#8696a0] text-xs uppercase font-black tracking-widest">
                  <div className="w-2 h-2 bg-[#00a884] rounded-full animate-pulse"></div>
                  Aguardando Pagamento...
                </div>
              </div>

              <button 
                onClick={handleCopyPix} 
                className="w-full bg-[#202c33] text-white font-bold py-5 rounded-3xl border border-white/10 flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl mb-8 group"
              >
                {copyText === 'Código Copiado!' ? <CheckCircle className="text-[#00a884]" /> : <Copy size={24} className="group-hover:rotate-12 transition-transform" />}
                <span className="text-xl uppercase tracking-wide">{copyText}</span>
              </button>

              <p className="text-[#8696a0] text-[13px] text-center italic max-w-[300px] leading-relaxed opacity-60">
                Abra seu banco, escolha "Pagar com PIX" e cole o código. <br/> Seu link de acesso será liberado em segundos.
              </p>
            </div>
          )}

          {step === 'upsell' && (
            <div className="text-center space-y-6 animate-fadeIn pt-10">
              <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20 shadow-2xl">
                <TrendingUp size={60} className="text-yellow-500" />
              </div>
              <h2 className="text-4xl font-black text-white italic uppercase leading-tight">ESPERA, AMOR! 🔥</h2>
              <p className="text-[#8696a0] text-lg px-4">
                Quer levar também meu <span className="text-white font-bold uppercase">Pack de Lives Gravadas</span> por apenas mais <span className="text-yellow-500 font-black text-2xl">R$ 9,90</span>?
              </p>
              <div className="bg-[#202c33] p-8 rounded-[2.5rem] border border-yellow-500/20 shadow-2xl">
                <button onClick={() => handleGeneratePix(990, 'qr2')} disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#0b141a] font-black py-5 rounded-2xl mb-6 text-xl uppercase shadow-lg active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'SIM, QUERO TUDO AGORA! 😈'}
                </button>
                <button onClick={() => setStep('success')} className="text-[#8696a0] text-sm underline underline-offset-8 decoration-white/10 hover:text-white transition-colors">
                  Não, quero apenas o acesso básico
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
