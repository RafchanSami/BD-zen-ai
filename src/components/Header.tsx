import React from 'react';
import { Menu, Search, RotateCcw, LogIn, LogOut, Download } from 'lucide-react';
import { PreferredLanguage, AIModel } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  enableSearch: boolean;
  setEnableSearch: (val: boolean) => void;
  language: PreferredLanguage;
  setLanguage: (lang: PreferredLanguage) => void;
  model: AIModel;
  setModel: (m: AIModel) => void;
  onClearChat: () => void;
  onDownloadChat?: () => void;
  onOpenZenModal: () => void;
  onOpenHeritageDrawer: () => void;
  onOpenAuthModal: () => void;
  onInstallPWA?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  enableSearch,
  setEnableSearch,
  language,
  setLanguage,
  model,
  setModel,
  onClearChat,
  onDownloadChat,
  onOpenZenModal,
  onOpenHeritageDrawer,
  onOpenAuthModal,
  onInstallPWA,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-3 sm:px-8 sticky top-0 z-30 shadow-2xs">
      
      {/* Left side: Menu Toggle + App Logo + Status Badge */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition focus:outline-none"
          title="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* App Logo & Name */}
        <div className="flex items-center space-x-3">
          <img
            src="https://i.imgur.com/95NcIt4.png"
            alt="BD-Zen AI Logo"
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain rounded-xl border border-emerald-300 shadow-sm p-0.5 bg-white shrink-0"
          />
          <span className="font-bold text-xl text-[#006a4e] font-serif hidden xs:inline tracking-tight">
            BD-Zen AI
          </span>
        </div>

      </div>

      {/* Right Side Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5">
        
        {/* PWA Install Button */}
        {onInstallPWA && (
          <button
            onClick={onInstallPWA}
            className="px-2.5 py-1.5 bg-[#f42a41] hover:bg-[#d02035] text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition shadow-xs"
            title="Install App (PWA)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* Search Grounding Quick Toggle */}
        <button
          onClick={() => setEnableSearch(!enableSearch)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 border transition ${
            enableSearch
              ? 'bg-green-50 text-[#006a4e] border-green-300'
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
          }`}
          title="Google Search Grounding (Live Info)"
        >
          <Search className="w-3.5 h-3.5 text-[#006a4e]" />
          <span className="hidden md:inline">Live Search</span>
        </button>

        {/* Clear Chat Button */}
        <button
          onClick={onClearChat}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Reset Chat"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* User Auth Button */}
        {user ? (
          <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-gray-800 truncate max-w-[120px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Online</span>
            </div>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full border border-emerald-500 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#006a4e] text-white font-bold text-xs flex items-center justify-center border border-[#005a42]">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={() => logout()}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#006a4e] hover:bg-[#005a42] text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

      </div>

    </header>
  );
};

