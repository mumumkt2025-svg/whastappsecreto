
import React, { useState, useEffect, useRef } from 'react';
import { Copy, CheckCircle, Loader2, VolumeX, ShieldCheck, ChevronLeft, TrendingUp, Users, MoreVertical, Video, Phone, Mic, Info } from 'lucide-react';
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

  const simMessages = [
    { name: "+55 " + (userDDD || "19") + " 94238-9726", text: "Acabei de entrar, o conteúdo tá insano! 🔥", time: "14:02", color: "#00a884" },
    { name: "+55 19 99818-6442", text: "Gente, vale cada centavo. Thaisinha se superou kkkk", time: "14:03", color: "#34b7f1" },
    { name: "Marcos Oliveira", text: "O pix caiu e o link veio na hora. Top!", time: "14:04", color: "#ff8300" },
    { name: "Julia Santos", text: "Meu Deus, olha esse vídeo novo que ela postou... 😱🔥", time: "14:05", color: "#a75cf2" }
  ];

  // Simulação das mensagens do grupo (Prova Social)
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
            setTimeout(() => setStep('intro'), 2500);
          }, 1000);
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Polling de pagamento real (Verifica se pagou para avançar)
  useEffect(() => {
    let interval: any;
    if ((step === 'qr1' || step === 'qr2') && pixData?.id) {
      interval = setInterval(async () => {
        try {
          const url = `${PROXY}${encodeURIComponent(`${GGPIX_STATUS_URL}/${pixData.id}`)}`;
          const response = await fetch(url, {
            headers: { 'X-API-Key': GGPIX_API_KEY }
          });
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
        } catch (e) {
          console.error("Erro ao checar status", e);
        }
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
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': GGPIX_API_KEY
        },
        body: JSON.stringify({
          amountCents: amountCents,
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
      } else {
        alert("Erro ao gerar pagamento. Tente novamente.");
      }
    } catch (err) {
      alert("Falha na conexão.");
    } finally {
      setLoading(false);
    }
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
              Você recebeu um convite para o grupo de <span className="font-bold">{userCity}</span>. <br/><br/> Toque abaixo para entrar e ver as mídias exclusivas.
            </p>
          </div>
          <button onClick={() => setStep('group_chat_sim')} className="w-full max-w-sm bg-[#00a884] text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all uppercase">
            Entrar no Grupo
          </button>
        </div>
      </div>
    );
  }

  // TELA 2: SIMULAÇÃO DE CHAT DARK
  if (step === 'group_chat_sim') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b141a] flex flex-col animate-fadeIn overflow-hidden">
        <div className="p-3 bg-[#202c33] flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <ChevronLeft size={24} className="text-white" />
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
              <img src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" className="w-full h-full object-cover" />
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
        <div 
          className="flex-1 p-4 space-y-3 overflow-y-auto"
          style={{ backgroundImage: `url('https://i.pinimg.com/736x/56/ea/b7/56eab7512f1021bdd4cf04952ad45a2c.jpg')`, backgroundSize: '400px' }}
        >
          <div className="flex justify-center mb-6">
            <span className="bg-[#1f2c34] text-white/60 text-[10px] px-3 py-1 rounded-lg uppercase font-bold tracking-widest">Entrando...</span>
          </div>
          {visibleMessages.map((msg, idx) => (
            <div key={idx} className="flex flex-col items-start animate-slideUp">
              <div className="bg-[#202c33] p-2 px-3 rounded-xl rounded-tl-none max-w-[85%] shadow-md border-l-4" style={{ borderLeftColor: msg.color }}>
                <p className="text-[11px] font-black uppercase mb-1" style={{ color: msg.color }}>{msg.name}</p>
                <p className="text-white text-[14px] leading-relaxed">{msg.text}</p>
                <p className="text-[10px] text-white/30 text-right mt-1">{msg.time}</p>
              </div>
            </div>
          ))}
          {isThaisinhaTyping && (
            <div className="flex items-center gap-2 p-2 px-4 bg-[#202c33]/80 rounded-full w-fit animate-pulse border border-white/5">
              <Mic size={14} className="text-[#00a884]" />
              <span className="text-[#00a884] text-[11px] font-bold uppercase">Thaisinha gravando áudio...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
    );
  }

  // TELA FINAL DE SUCESSO (SÓ APÓS OS PAGAMENTOS)
  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b141a] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-[#00a884]/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={60} className="text-[#00a884]" />
        </div>
        <h2 className="text-2xl font-black text-white italic uppercase leading-tight">ACESSO LIBERADO! 🔥</h2>
        <p className="text-[#8696a0] mt-2 mb-8 italic">Pagamento confirmado. Toque abaixo para entrar no grupo oficial e ver tudo agora mesmo.</p>
        <button onClick={() => window.location.href = 'https://t.me/+exemplo'} className="w-full bg-[#00a884] text-white font-black py-4 rounded-2xl uppercase shadow-xl active:scale-95 transition-all">
          ENTRAR NO GRUPO AGORA 😈
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-[#0b141a] overflow-y-auto animate-slideUp">
      <div className="max-w-md mx-auto min-h-screen bg-[#0b141a] pb-10">
        <div className="p-4 bg-[#202c33] flex items-center gap-3 sticky top-0 z-50 border-b border-white/5">
          <button onClick={() => window.location.reload()} className="text-white"><ChevronLeft size={24} /></button>
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">🔥CLUBE SECRETO - {userCity}</h3>
            <span className="text-[10px] text-[#00a884] flex items-center gap-1 uppercase font-bold tracking-tighter"><ShieldCheck size={10} /> PAGAMENTO SEGURO</span>
          </div>
        </div>

        <div className="p-6">
          {step === 'intro' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-black aspect-video border border-white/10">
                <video ref={vslVideoRef} src="https://pub-a47e1d95fa6d47dcbaf7d09537629b3b.r2.dev/vslgruposecreto.mp4" className="w-full h-full object-cover" autoPlay muted loop playsInline />
                {showVslOverlay && (
                  <div onClick={() => { if(vslVideoRef.current){vslVideoRef.current.muted=false; vslVideoRef.current.play(); setShowVslOverlay(false);}}} className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center cursor-pointer">
                    <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center shadow-2xl"><VolumeX size={40} className="text-white" /></div>
                    <p className="text-white font-black mt-6 text-sm animate-pulse uppercase tracking-widest text-center">Clique para ouvir 🔊</p>
                  </div>
                )}
              </div>
              <div className="bg-[#202c33] p-6 rounded-[2rem] border border-white/5 text-center">
                <h2 className="text-xl font-black text-white mb-2 italic uppercase">ACESSO QUASE PRONTO! 🔥</h2>
                <p className="text-[#8696a0] text-sm leading-relaxed mb-6 italic">Cobramos uma taxa simbólica de <span className="text-white font-bold text-lg">R$ 8,90</span> para manter a segurança do grupo.</p>
                <button onClick={() => handleGeneratePix(890, 'qr1')} disabled={loading} className="w-full bg-[#00a884] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 uppercase shadow-xl active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin" /> : 'GERAR MEU PIX AGORA ⚡'}
                </button>
              </div>
            </div>
          )}

          {(step === 'qr1' || step === 'qr2') && pixData && (
            <div className="flex flex-col items-center animate-fadeIn">
              {/* Tutorial Pix igual ao exemplo */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video w-full mb-6 border border-white/5">
                <video ref={tutorialVideoRef} src="https://pub-9ad786fb39ec4b43b2905a55edcb38d9.r2.dev/tutorial-pix.mp4" className="w-full h-full object-cover" autoPlay muted loop playsInline />
                <div onClick={() => { if(tutorialVideoRef.current){tutorialVideoRef.current.muted=false;}}} className="absolute top-3 right-3 bg-black/50 p-2 rounded-full cursor-pointer"><VolumeX size={20} className="text-white" /></div>
              </div>

              <div className="bg-white p-5 rounded-[3rem] mb-6 shadow-2xl border-[6px] border-[#00a884] w-full max-w-[280px] aspect-square flex items-center justify-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixData.pix_code)}`} alt="QR Code" className="w-full h-full object-contain" />
              </div>
              
              <div className="text-center mb-8">
                <p className="text-[#8696a0] text-xs uppercase font-black tracking-widest mb-2">Seu PIX expira em:</p>
                <p className="text-[#00a884] font-black text-5xl tabular-nums drop-shadow-sm">{formatTime(timeLeft)}</p>
              </div>

              <button onClick={handleCopyPix} className="w-full bg-[#202c33] text-white font-bold py-5 rounded-3xl border border-white/10 flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl mb-8 group">
                <Copy size={24} className="group-hover:rotate-6 transition-transform" />
                <span className="text-xl uppercase tracking-wide">{copyText}</span>
              </button>
              
              <div className="bg-[#00a884]/10 border border-[#00a884]/20 p-5 rounded-2xl flex items-center gap-4 w-full">
                <Loader2 size={24} className="text-[#00a884] animate-spin" />
                <p className="text-[#00a884] text-xs font-black uppercase tracking-tight">Detectando pagamento... Não feche esta tela!</p>
              </div>
            </div>
          )}

          {step === 'upsell' && (
            <div className="text-center space-y-6 animate-fadeIn pt-6">
              <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20 shadow-xl">
                <TrendingUp size={44} className="text-yellow-500" />
              </div>
              <h2 className="text-4xl font-black text-white italic uppercase leading-tight">ESPERA, AMOR! 🔥</h2>
              <p className="text-[#8696a0] text-lg px-4 italic leading-tight">
                Vi que você pagou o grupo, mas quer levar também meu <span className="text-white font-bold">Arquivo de Lives Sem Censura</span> por apenas mais <span className="text-yellow-500 font-black text-3xl">R$ 9,90</span>?
              </p>
              <div className="bg-[#202c33] p-8 rounded-[2.5rem] border border-yellow-500/20 shadow-2xl">
                <button onClick={() => handleGeneratePix(990, 'qr2')} disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#0b141a] font-black py-5 rounded-2xl mb-6 text-xl uppercase shadow-lg active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'SIM, QUERO TUDO AGORA! 😈'}
                </button>
                <button onClick={() => setStep('success')} className="text-[#8696a0] text-sm underline underline-offset-8 opacity-50 hover:text-white transition-all">Não, quero apenas o acesso básico</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
