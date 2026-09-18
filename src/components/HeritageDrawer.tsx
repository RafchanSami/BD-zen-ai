import React from 'react';
import { HERITAGE_TOPICS } from '../data/bdPrompts';
import { X, BookOpen, ChevronRight, Award, History, Heart } from 'lucide-react';

interface HeritageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export const HeritageDrawer: React.FC<HeritageDrawerProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-emerald-200 overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-red-400" />
            <div>
              <h2 className="text-base font-bold font-serif">History & Heritage Guide</h2>
              <p className="text-xs text-emerald-300/80">Historical Knowledge Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-emerald-900 text-emerald-200 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-emerald-50/30">
          
          <div className="p-3.5 bg-emerald-900 text-white rounded-xl border border-emerald-700 shadow-sm space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-300">
              <Award className="w-4 h-4 text-red-400" />
              <span>BD-Zen AI Heritage Guide</span>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Explore rich history, significant movements, and cultural heritage. Click any topic below to learn details.
            </p>
          </div>

          <div className="space-y-3">
            {HERITAGE_TOPICS.map((topic) => (
              <div
                key={topic.id}
                className="p-4 bg-white rounded-xl border border-emerald-200/90 shadow-xs hover:border-emerald-500 transition space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200/60">
                      {topic.dateOrEra}
                    </span>
                    <h3 className="text-sm font-bold text-emerald-950 mt-1 font-serif">
                      {topic.titleEn || topic.titleBn}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {topic.summaryEn || topic.summaryBn}
                </p>

                <button
                  onClick={() => {
                    onSelectPrompt(topic.detailsPrompt);
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-semibold flex items-center justify-between transition border border-emerald-200"
                >
                  <span>Ask AI for details?</span>
                  <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white rounded-xl border border-emerald-200/80 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-emerald-900">In Honor of Martyrs and National Heroes</p>
            <p className="text-[11px] text-slate-400">BD-Zen AI 2026</p>
          </div>

        </div>

      </div>
    </div>
  );
};
