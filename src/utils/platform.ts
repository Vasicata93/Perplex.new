/**
 * Multi-Platform Detection Utility
 * Helps application adapt dynamically to different distribution targets:
 * - PWA (Progressive Web App)
 * - Capacitor (Android/iOS Native Wrapper)
 * - Electron (macOS/Windows/Linux Desktop)
 */

declare global {
  interface Window {
    Capacitor?: any;
    electronAPI?: any;
    process?: any;
  }
}

export const isCapacitor = (): boolean => {
  return typeof window !== 'undefined' && !!window.Capacitor;
};

export const isElectron = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Standard user agent or ipcRenderer checks
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf(' electron/') > -1) {
    return true;
  }
  
  // Checking window.process
  if (window.process && window.process.type === 'renderer') {
    return true;
  }
  
  // Check for custom electron API
  if (!!window.electronAPI) {
    return true;
  }
  
  return false;
};

export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (navigator as any).standalone === true;
  
  return isStandalone || isIOSStandalone;
};

export const getPlatformName = (): 'PWA' | 'Android (Capacitor)' | 'macOS (Electron)' | 'Web' => {
  if (isElectron()) return 'macOS (Electron)';
  if (isCapacitor()) return 'Android (Capacitor)';
  if (isPWA()) return 'PWA';
  return 'Web';
};
