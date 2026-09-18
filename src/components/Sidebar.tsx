import React, { useState } from 'react';
import { MessageSquare, Search, RotateCcw, X, ShieldCheck, Plus, LogIn, LogOut, Download } from 'lucide-react';
import { PreferredLanguage, AIModel } from '../types';
import { useAuth } from '../context/AuthContext';
import { ChatSession } from '../lib/useRealtimeChat';
import { AccentTheme } from '../lib/theme';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  enableSearch: boolean;
  setEnableSearch: (val: boolean) => void;
  language: PreferredLanguage;
  setLanguage: (lang: PreferredLanguage) => void;
  model: AIModel;
  setModel: (m: AIModel) => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onStartNewSession: () => void;
  onClearChat: () => void;
  onOpenZenModal: () => void;
  onOpenHeritageDrawer: () => void;
  onSelectPrompt: (prompt: string) => void;
  onOpenAuthModal: () => void;
  onInstallPWA?: () => void;
  currentTheme?: AccentTheme;
  onSelectTheme?: (theme: AccentTheme) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  enableSearch,
  setEnableSearch,
  language,
  setLanguage,
  model,
  setModel,
  sessions,
  activeSessionId,
  onSelectSession,
  onStartNewSession,
  onClearChat,
  onOpenAuthModal,
  onInstallPWA,
  currentTheme = 'green',
  onSelectTheme,
}) => {
  const { user, logout } = useAuth();
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');

  const filteredSessions = sessions.filter((s) => {
    if (!sessionSearchQuery.trim()) return true;
    const q = sessionSearchQuery.toLowerCase();
    const titleMatch = (s.title || '').toLowerCase().includes(q);
    const contentMatch = s.messages?.some((m) =>
      (m.content || '').toLowerCase().includes(q)
    );
    return titleMatch || contentMatch;
  });

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 bg-[#006a4e] text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Large Prominent Logo */}
        <div className="p-4 border-b border-[#005a42] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md shrink-0 overflow-hidden border border-emerald-300 p-1">
              <img
                src="https://i.imgur.com/95NcIt4.png"
                alt="BD-Zen AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-serif">BD-Zen AI</h1>
              <p className="text-[10px] text-emerald-200/90 uppercase font-semibold tracking-wider flex items-center gap-1">
                <span>Bangladesh</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Real-Time AI</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#005a42] text-emerald-200 hover:text-white transition"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Start New Chat & PWA Install Button */}
        <div className="p-3 pb-0 space-y-2">
          <button
            onClick={() => {
              onStartNewSession();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 p-2.5 bg-white text-[#006a4e] hover:bg-emerald-50 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Chat</span>
          </button>

          {onInstallPWA && (
            <button
              onClick={onInstallPWA}
              className="w-full flex items-center justify-center space-x-2 p-2 bg-[#f42a41] hover:bg-[#d02035] text-white rounded-xl text-xs font-bold transition shadow-sm"
              title="Install App (PWA)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App (PWA)</span>
            </button>
          )}
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Real-time Sessions List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/70 flex items-center gap-1.5">
                <span>Real-Time Sessions</span>
                {user && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
              </span>
              <button
                onClick={onClearChat}
                title="Reset Chat"
                className="text-[11px] text-emerald-300 hover:text-red-300 transition flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Session Search Input */}
            {user && sessions.length > 0 && (
              <div className="relative my-1.5">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/60" />
                <input
                  type="text"
                  value={sessionSearchQuery}
                  onChange={(e) => setSessionSearchQuery(e.target.value)}
                  placeholder="Filter sessions..."
                  className="w-full bg-[#005a42]/60 border border-emerald-400/20 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-emerald-200/50 focus:outline-none focus:border-emerald-300 transition"
                />
                {sessionSearchQuery && (
                  <button
                    onClick={() => setSessionSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-200/70 hover:text-white"
                    title="Clear filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {user && sessions.length > 0 ? (
                filteredSessions.length > 0 ? (
                  filteredSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSelectSession(s.id);
                        onClose();
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition group flex items-center space-x-2 ${
                        s.id === activeSessionId
                          ? 'bg-white text-[#006a4e] font-bold border-white shadow-xs'
                          : 'bg-[#ffffff15] hover:bg-[#ffffff25] border-[#ffffff20] text-emerald-50'
                      }`}
                    >
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${s.id === activeSessionId ? 'text-[#006a4e]' : 'text-emerald-300'}`} />
                      <span className="text-xs truncate flex-1">{s.title || 'Conversation'}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-emerald-200/60 italic border border-[#ffffff15] rounded-xl bg-[#ffffff08]">
                    No sessions match "{sessionSearchQuery}"
                  </div>
                )
              ) : (
                <div className="p-3 text-center text-xs text-emerald-200/60 italic border border-[#ffffff15] rounded-xl bg-[#ffffff08]">
                  No active sessions
                </div>
              )}
            </div>
          </div>

          {/* Quality Banner */}
          <div className="p-3 rounded-xl bg-[#005a42]/80 border border-emerald-500/30 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Accurate & Reliable</span>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-snug">
              Delivering precise, unbiased AI assistance with cultural empathy.
            </p>
          </div>

        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-[#005a42] bg-[#005a42]/60">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-white shrink-0 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white text-[#006a4e] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-xs truncate">
                  <div className="font-bold text-white truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-300/80 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Firestore Syncing
                  </div>
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="p-1.5 text-emerald-300 hover:text-red-300 hover:bg-[#005a42] rounded-lg transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuthModal();
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-[#8B0000] hover:bg-[#a00000] text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Account</span>
            </button>
          )}
        </div>

      </aside>
    </>
  );
};
