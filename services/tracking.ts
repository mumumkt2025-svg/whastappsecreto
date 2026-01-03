
const API_BASE = "https://api.counterapi.dev/v1";

// Helper para extrair o slug da URL de forma consistente
const getSlug = () => {
  try {
    const path = window.location.pathname;
    // Remove /painel e barras extras
    const cleanPath = path.replace(/\/painel\/?$/, '').replace(/\/$/, '');
    const parts = cleanPath.split('/').filter(p => p.length > 0);
    const slug = parts.length > 0 ? parts[parts.length - 1] : 'main';
    return slug;
  } catch (e) {
    return 'main';
  }
};

// Namespace único e SEGURO (sem espaços, apenas letras, números e underscores)
const getNamespace = () => {
  const slug = getSlug();
  // Forçamos a remoção de qualquer coisa que não seja letra ou número
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `vott_v4_${cleanSlug}`;
};

// h1 = home/visita, h2 = iniciou chat, h3 = abriu checkout, h4 = pagou 8.90, h5 = pagou 9.90
export const trackEvent = async (key: 'h1' | 'h2' | 'h3' | 'h4' | 'h5') => {
  const namespace = getNamespace();
  const targetUrl = `${API_BASE}/${namespace}/${key}/up`;
  
  try {
    // Para incrementar (track), usamos o AllOrigins como pass-through
    // Adicionamos um timestamp para evitar cache do proxy
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&_=${Date.now()}`;
    
    await fetch(proxyUrl, { 
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    
    console.log(`[Track] Evento ${key} disparado com sucesso.`);
  } catch (e) {
    console.warn(`[Track] Falha silenciosa no evento ${key}`);
  }
};

export const getStats = async () => {
  const namespace = getNamespace();
  const keys = ['h1', 'h2', 'h3', 'h4', 'h5'];
  
  try {
    const results = await Promise.all(
      keys.map(async (key) => {
        try {
          const targetUrl = `${API_BASE}/${namespace}/${key}`;
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&_=${Date.now()}`;
          
          const res = await fetch(proxyUrl);
          if (!res.ok) return { count: 0 };
          
          const wrapper = await res.json();
          // AllOrigins coloca a resposta original dentro de 'contents' como string
          const data = JSON.parse(wrapper.contents);
          
          return { count: data.count || 0 };
        } catch (err) {
          return { count: 0 };
        }
      })
    );
    
    return {
      visits: Number(results[0]?.count || 0),
      chat: Number(results[1]?.count || 0),
      checkout: Number(results[2]?.count || 0),
      sale1: Number(results[3]?.count || 0),
      sale2: Number(results[4]?.count || 0),
    };
  } catch (e) {
    console.error("[Dashboard] Erro ao buscar estatísticas:", e);
    return { visits: 0, chat: 0, checkout: 0, sale1: 0, sale2: 0 };
  }
};
