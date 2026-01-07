const API_BASE = 'https://whatsapp-backend-vott.onrender.com';
const PROXY = "https://corsproxy.io/?";

const getSlug = () => window.location.pathname.replace('/painel', '').split('/').filter(p => p).pop() || 'home';

const getNamespace = () => {
  const slug = getSlug();
  return `thaisinha_chat_${slug}`;
};

export const trackEvent = async (event: string) => {
  const namespace = getNamespace();
  const url = `${API_BASE}/track/${namespace}/${event}`;
  const urlWithProxy = `${PROXY}${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(urlWithProxy);
    if (!response.ok) throw new Error('Tracking failed');
    return true;
  } catch (err) {
    console.error(`Error tracking ${event}:`, err);
    return false;
  }
};

export const getStats = async () => {
  const namespace = getNamespace();
  const url = `${API_BASE}/stats/${namespace}`;
  const urlWithProxy = `${PROXY}${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(urlWithProxy);
    const data = await response.json();
    return {
      visits: data.h1 || 0,
      chat: data.h2 || 0,
      checkout: data.h3 || 0,
      sale1: data.h4 || 0,
      sale2: data.h5 || 0
    };
  } catch (err) {
    console.error('Error fetching stats:', err);
    return { visits: 0, chat: 0, checkout: 0, sale1: 0, sale2: 0 };
  }
};
