
import React, { useState, useEffect, useRef } from 'react';
/* Added missing TrendingUp import from lucide-react */
import { Copy, CheckCircle, Loader2, VolumeX, MoreVertical, Video, Phone, Mic, Paperclip, Smile, ShieldCheck, ChevronLeft, TrendingUp } from 'lucide-react';
import { trackEvent } from '../services/tracking';

const SYNCPAY_CLIENT_ID = "03811fff-b6ec-4902-b89e-9515f7e873a0";
const SYNCPAY_CLIENT_SECRET = "9b1d037d-d35b-4749-add8-613e0e5c9353";
const SYNCPAY_BASE_URL = "https://api.syncpay.com.br";
const PROXY = "https://corsproxy.io/?";

const getSlug = () => window.location.pathname.replace('/painel', '').split('/').filter(p => p).pop() || 'home';

interface PaymentPanelProps {
  userCity: string;
  userDDD: string;
}

type Step = 'intro' | 'qr1' | 'upsell' | 'qr2' | 'success';

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ userCity, userDDD }) => {
  const [step, setStep] = useState<Step>('intro');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [copyText, setCopyText] = useState('Copiar Código PIX');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showVslOverlay, setShowVslOverlay] = useState(true);
  
  const vslVideoRef = useRef<HTMLVideoElement>(null);

  const getSyncPayToken = async () => {
    const url = `${SYNCPAY_BASE_URL}/api/partner/v1/auth-token`;
    const urlWithProxy = `${PROXY}${encodeURIComponent(url)}`;
    
    try {
      const response = await fetch(urlWithProxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: SYNCPAY_CLIENT_ID,
          client_secret: SYNCPAY_CLIENT_SECRET
        })
      });
      const data = await response.json();
      if (data.access_token) {
        setAuthToken(data.access_token);
        return data.access_token;
      }
      return null;
    } catch (err) {
      console.error("Erro SyncPay Auth:", err);
      return null;
    }
  };

  const handleGeneratePix = async (value: number, nextStep: Step) => {
    setLoading(true);
    const token = await getSyncPayToken();
    
    if (!token) {
      alert("Erro ao conectar com provedor de pagamento. Tente novamente.");
      setLoading(false);
      return;
    }

    const url = `${SYNCPAY_BASE_URL}/api/partner/v1/cash-in`;
    const urlWithProxy = `${PROXY}${encodeURIComponent(url)}`;

    try {
      const response = await fetch(urlWithProxy, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: value,
          description: `Acesso Clube Secreto - ${getSlug()}`,
          client: {
            name: "Cliente VIP",
            cpf: "00000000000",
            email: "cliente@vip.com",
            phone: userDDD + "999999999"
          }
        })
      });

      const data = await response.json();
      if (data.pix_code) {
        setPixData(data);
        setStep(nextStep);
        trackEvent('h4'); // Iniciou checkout
      }
    } catch (err) {
      console.error("Erro ao gerar PIX:", err);
    } finally {
      setLoading(false);
    }
  };

  // Polling para verificar se o pagamento foi concluído
  useEffect(() => {
    let interval: any;
    if ((step === 'qr1' || step === 'qr2') && pixData?.identifier && authToken) {
      interval = setInterval(async () => {
        const url = `${SYNCPAY_BASE_URL}/api/partner/v1/transaction/${pixData.identifier}`;
        const urlWithProxy = `${PROXY}${encodeURIComponent(url)}`;
        
        try {
          const response = await fetch(urlWithProxy, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          const result = await response.json();
          
          if (result.data && (result.data.status === 'completed' || result.data.status === 'paid')) {
            if (step === 'qr1') {
              setStep('upsell');
              trackEvent('h4'); // Confirmou venda 1
            } else {
              setStep('success');
              trackEvent('h5'); // Confirmou venda 2
            }
            clearInterval(interval);
          }
        } catch (e) {}
      }, 7000);
    }
    return () => clearInterval(interval);
  }, [step, pixData, authToken]);

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

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b141a] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="w-24 h-24 bg-[#00a884] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,168,132,0.4)]">
          <CheckCircle size={50} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 italic">ACESSO LIBERADO!</h2>
        <p className="text-[#8696a0] mb-8">Seu pagamento foi confirmado. Clique abaixo para entrar no grupo secreto agora!</p>
        <button 
          onClick={() => window.location.href = 'https://t.me/+exemplo_link'}
          className="w-full bg-[#00a884] text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-lg"
        >
          ENTRAR NO TELEGRAM 🔥
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-[#0b141a] overflow-y-auto animate-slideUp">
      <div className="max-w-md mx-auto min-h-screen bg-[#0b141a] pb-10">
        
        {/* HEADER MODAL */}
        <div className="p-4 bg-[#202c33] flex items-center gap-3 sticky top-0 z-50 border-b border-white/5">
          <button onClick={() => window.location.reload()} className="text-white"><ChevronLeft size={24} /></button>
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img src="https://midia.jdfnu287h7dujn2jndjsifd.com/perfil.webp" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">Clube Secreto da Thaisinha</h3>
            <span className="text-[11px] text-[#00a884] flex items-center gap-1"><ShieldCheck size={10} /> Pagamento 100% Seguro</span>
          </div>
        </div>

        <div className="p-6">
          {step === 'intro' && (
            <div className="space-y-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black aspect-video border border-white/10">
                <video 
                  ref={vslVideoRef}
                  src="https://pub-a47e1d95fa6d47dcbaf7d09537629b3b.r2.dev/vslgruposecreto.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                {showVslOverlay && (
                  <div 
                    onClick={() => { if(vslVideoRef.current){vslVideoRef.current.muted=false; vslVideoRef.current.play(); setShowVslOverlay(false);}}}
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-16 h-16 bg-[#00a884] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <VolumeX size={32} className="text-white" />
                    </div>
                    <p className="text-white font-bold mt-4 text-sm animate-pulse">CLIQUE PARA OUVIR O CONVITE 🔊</p>
                  </div>
                )}
              </div>

              <div className="bg-[#202c33] p-5 rounded-3xl border border-white/5">
                <h2 className="text-xl font-black text-white mb-3 italic">VOCÊ FOI CONVOCADO! 🔥</h2>
                <p className="text-[#8696a0] text-sm leading-relaxed mb-4">
                  Amor, para manter o grupo seguro e sem curiosos, cobramos uma taxa única simbólica de apenas <span className="text-white font-bold">R$ 8,90</span>.
                </p>
                <ul className="space-y-2 text-sm text-[#d1d7db] mb-6">
                  <li className="flex items-center gap-2">✅ +500 Vídeos e Fotos Sem Censura</li>
                  <li className="flex items-center gap-2">✅ Lives Exclusivas toda semana</li>
                  <li className="flex items-center gap-2">✅ Chat direto comigo no privado</li>
                </ul>
                <button 
                  onClick={() => handleGeneratePix(8.90, 'qr1')}
                  disabled={loading}
                  className="w-full bg-[#00a884] hover:bg-[#00c99d] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-lg"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'GERAR MEU ACESSO AGORA 🚀'}
                </button>
              </div>
            </div>
          )}

          {(step === 'qr1' || step === 'qr2') && pixData && (
            <div className="flex flex-col items-center animate-fadeIn">
              <div className="bg-white p-4 rounded-3xl mb-6 shadow-2xl border-4 border-[#00a884]">
                <img 
                  src={`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(pixData.pix_code)}`}
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              </div>
              
              <div className="text-center mb-6">
                <p className="text-[#00a884] font-black text-xl mb-1 tabular-nums">{formatTime(timeLeft)}</p>
                <p className="text-[#8696a0] text-sm uppercase font-bold tracking-widest">Aguardando Pagamento...</p>
              </div>

              <div className="w-full space-y-4">
                <button 
                  onClick={handleCopyPix}
                  className="w-full bg-[#202c33] text-white font-bold py-4 rounded-2xl border border-white/10 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  {copyText === 'Código Copiado!' ? <CheckCircle className="text-[#00a884]" /> : <Copy size={20} />}
                  {copyText}
                </button>
                <div className="bg-[#202c33]/50 p-4 rounded-2xl border border-white/5 text-center">
                  <p className="text-[#8696a0] text-xs leading-relaxed italic">
                    Abra o app do seu banco, escolha "Pagar via PIX" e escaneie o código ou cole a chave "Copia e Cola". 
                    O acesso é liberado instantaneamente após o pagamento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'upsell' && (
            <div className="text-center space-y-6 animate-fadeIn">
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={40} className="text-yellow-500" />
              </div>
              <h2 className="text-2xl font-black text-white italic">ESPERA, AMOR! 😱</h2>
              <p className="text-[#8696a0]">
                Detectamos que você é um cliente especial. Quer desbloquear também o meu <span className="text-white font-bold">Arquivo Pessoal de Lives Gravadas</span> por apenas mais <span className="text-yellow-500 font-bold">R$ 9,90</span>?
              </p>
              <div className="bg-[#202c33] p-4 rounded-2xl border border-yellow-500/20">
                <p className="text-xs text-yellow-500 font-bold mb-2">OFERTA ÚNICA: DE R$ 47,00 POR R$ 9,90</p>
                <button 
                  onClick={() => handleGeneratePix(9.90, 'qr2')}
                  disabled={loading}
                  className="w-full bg-yellow-500 text-[#0b141a] font-black py-4 rounded-xl mb-3 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'SIM, QUERO TUDO! 😈'}
                </button>
                <button 
                  onClick={() => setStep('success')}
                  className="text-[#8696a0] text-sm underline underline-offset-4"
                >
                  Não, quero apenas o grupo básico
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
