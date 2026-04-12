"use client";

import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show manual prompt for iOS after a delay if not standalone
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 10000); // Show after 10s
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[10000] animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-card border border-infra/30 p-4 rounded-2xl shadow-2xl backdrop-blur-xl bg-solid flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-infra/10 rounded-xl flex items-center justify-center shrink-0 border border-infra/20 text-infra">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-text text-sm">Download InfraCharge</h4>
            <p className="text-xs text-muted">Install for a faster, better experience.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isIOS ? (
            <div className="flex flex-col items-center">
               <span className="text-[10px] text-muted mb-1 flex items-center gap-1">Tap <Share className="w-3 h-3"/> then "Add to Home Screen"</span>
            </div>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="px-4 py-2 bg-infra text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-lg"
            >
              Install
            </button>
          )}
          
          <button 
            onClick={() => setShowPrompt(false)}
            className="p-1 text-muted hover:text-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
