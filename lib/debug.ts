export const debug = {
  log: (message: string, data?: any) => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  }
};