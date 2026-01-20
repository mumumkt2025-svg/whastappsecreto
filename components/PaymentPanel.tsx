
import React, { useState, useEffect, useRef } from 'react';
import { Copy, CheckCircle, Loader2, VolumeX, ShieldCheck, ChevronLeft, TrendingUp, Users, Info } from 'lucide-react';
import { trackEvent } from '../services/tracking';

const GGPIX_API_KEY = "gk_bd4a27e1ea571c80d04fbad41535c62a8e960cfbc1744e4e";
const GGPIX_BASE_URL = "https://ggpixapi.com/api/v1/pix/in";
const PROXY = "https://corsproxy.io/?";

interface PaymentPanelProps {
  userCity: string;
  userDDD: string;
}

type Step = 'group_invite' | 'intro' | 'qr1' | 'upsell' | 'qr2' | 'success';

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ userCity, userDDD }) => {
  const [step, setStep] = useState<Step>('group_invite');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [copyText, setCopyText] = useState('Copiar Código PIX');
  const [showVslOverlay, setShowVslOverlay] = useState(true);
  
  const vslVideoRef = useRef<HTMLVideoElement>(null);

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

      // Verificação rigorosa do retorno da GGPIX
      const code = data.pixCopyPaste || data.pixCode;
      
      if (code) {
        setPixData({ 
          pix_code: code, 
          id: data.id 
        });
        setStep(nextStep);
        trackEvent('h4');
      } else {
        console.error("Resposta inválida da GGPIX:", data);
        alert("Erro ao gerar pagamento. Tente novamente.");
      }
    } catch (err) {
      console.error("Erro de conexão GGPIX:", err);
      alert("Falha na conexão. Verifique sua internet.");
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

  if (step === 'group_invite') {
    return (
      <div className="fixed inset-0 z-50 bg-[#f0f2f5] flex flex-col animate-fadeIn">
        <div className="bg-[#00a884] h-32 w-full flex items-center justify-center p-4">
           <img src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" className="w-24 h-24 rounded-full border-4 border-white shadow-lg translate-y-12 object-cover" />
        </div>
        <div className="flex-1 pt-16 px-6 flex flex-col items-center">
          <h2 className="text-xl font-bold text-[#414a4f] text-center mb-1">Clube Secreto da Thaisinha</h2>
          <p className="text-[#8696a0] text-sm mb-8 flex items-center gap-2">
            <Users size={16} className="text-[#00a884]" /> Grupo Privado · 987 participantes
          </p>
          <div className="bg-white p-5 rounded-xl w-full max-w-sm mb-10 shadow-sm border border-black/5 text-center">
            <p className="text-[#414a4f] text-sm leading-relaxed">
              Você recebeu um convite para este grupo VIP. <br/><br/> Toque abaixo para ver o vídeo de boas-vindas.
            </p>
          </div>
          <button onClick={() => setStep('intro')} className="w-full max-w-sm bg-[#00a884] text-white font-bold py-4 rounded-lg shadow-md active:scale-95 transition-all uppercase">
            Entrar no Grupo
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b141a] flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={80} className="text-[#00a884] mb-4" />
        <h2 className="text-2xl font-black text-white italic uppercase">Acesso Liberado! 🔥</h2>
        <button onClick={() => window.location.href = 'https://t.me/+exemplo'} className="w-full bg-[#00a884] text-white font-black py-4 rounded-2xl mt-8 uppercase">
          ACESSAR AGORA 😈
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
            <h3 className="font-bold text-white leading-tight text-sm">Clube Secreto da Thaisinha</h3>
            <span className="text-[10px] text-[#00a884] flex items-center gap-1 uppercase font-bold tracking-tighter"><ShieldCheck size={10} /> PAGAMENTO SEGURO VIA GGPIX</span>
          </div>
        </div>

        <div className="p-6">
          {step === 'intro' && (
            <div className="space-y-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black aspect-video border border-white/10">
                <video ref={vslVideoRef} src="https://pub-a47e1d95fa6d47dcbaf7d09537629b3b.r2.dev/vslgruposecreto.mp4" className="w-full h-full object-cover" autoPlay muted loop playsInline />
                {showVslOverlay && (
                  <div onClick={() => { if(vslVideoRef.current){vslVideoRef.current.muted=false; vslVideoRef.current.play(); setShowVslOverlay(false);}}} className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer">
                    <div className="w-16 h-16 bg-[#00a884] rounded-full flex items-center justify-center shadow-xl"><VolumeX size={32} className="text-white" /></div>
                    <p className="text-white font-bold mt-4 text-sm animate-pulse uppercase">Clique para ouvir 🔊</p>
                  </div>
                )}
              </div>
              <div className="bg-[#202c33] p-6 rounded-3xl border border-white/5">
                <h2 className="text-xl font-black text-white mb-3 italic">ACESSO QUASE PRONTO! 🔥</h2>
                <p className="text-[#8696a0] text-sm leading-relaxed mb-6">Amor, cobramos apenas <span className="text-white font-bold text-lg">R$ 19,99</span> pela vaga. O acesso é liberado na hora.</p>
                <button onClick={() => handleGeneratePix(1999, 'qr1')} disabled={loading} className="w-full bg-[#00a884] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 uppercase">
                  {loading ? <Loader2 className="animate-spin" /> : 'GERAR MEU PIX AGORA ⚡'}
                </button>
              </div>
            </div>
          )}

          {(step === 'qr1' || step === 'qr2') && pixData && (
            <div className="flex flex-col items-center animate-fadeIn">
              {/* Box do QR Code com borda verde conforme o print */}
              <div className="bg-white p-4 rounded-[2.5rem] mb-8 shadow-2xl border-[5px] border-[#00a884] w-full max-w-[320px] aspect-square flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixData.pix_code)}`} 
                  alt="QR Code PIX" 
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    // Fallback para Google Charts se o primeiro falhar
                    (e.target as HTMLImageElement).src = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(pixData.pix_code)}`;
                  }}
                />
              </div>
              
              <div className="text-center mb-8">
                <p className="text-[#00a884] font-black text-5xl mb-2 tabular-nums">{formatTime(timeLeft)}</p>
                <p className="text-[#8696a0] text-xs uppercase font-black tracking-[0.2em] opacity-80">Aguardando Pagamento...</p>
              </div>

              <button 
                onClick={handleCopyPix} 
                className="w-full bg-[#202c33] text-white font-bold py-5 rounded-2xl border border-white/10 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl mb-8"
              >
                {copyText === 'Código Copiado!' ? <CheckCircle className="text-[#00a884]" /> : <Copy size={24} />}
                <span className="text-xl">{copyText}</span>
              </button>

              <p className="text-[#8696a0] text-[12px] text-center italic max-w-[300px] leading-relaxed opacity-60">
                Copie o código acima e pague no seu aplicativo do banco. <br/> Seu acesso será liberado automaticamente.
              </p>
            </div>
          )}

          {step === 'upsell' && (
            <div className="text-center space-y-6 animate-fadeIn pt-10">
              <TrendingUp size={60} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-white italic uppercase leading-tight">Espera, amor! <br/><span className="text-yellow-500">Oferta Única!</span></h2>
              <p className="text-[#8696a0] text-sm px-4">Quer meu <span className="text-white font-bold">Arquivo de Lives</span> por apenas mais <span className="text-yellow-500 font-bold text-lg">R$ 9,90</span>?</p>
              <div className="bg-[#202c33] p-6 rounded-3xl border border-yellow-500/20 shadow-xl">
                <button onClick={() => handleGeneratePix(990, 'qr2')} disabled={loading} className="w-full bg-yellow-500 text-[#0b141a] font-black py-4 rounded-xl mb-4 text-lg uppercase shadow-lg">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'SIM, QUERO TUDO! 😈'}
                </button>
                <button onClick={() => setStep('success')} className="text-[#8696a0] text-sm underline opacity-50">Não, quero apenas o grupo básico</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
