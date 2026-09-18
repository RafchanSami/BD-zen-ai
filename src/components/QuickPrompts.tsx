import React from 'react';
import { QUICK_PROMPTS } from '../data/bdPrompts';
import { Flag, GraduationCap, Mail, Compass, Cpu, Languages, Sprout, Sparkles } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flag': return <Flag className="w-4 h-4 text-[#f42a41]" />;
      case 'GraduationCap': return <GraduationCap className="w-4 h-4 text-[#006a4e]" />;
      case 'Mail': return <Mail className="w-4 h-4 text-[#006a4e]" />;
      case 'Compass': return <Compass className="w-4 h-4 text-teal-600" />;
      case 'Cpu': return <Cpu className="w-4 h-4 text-[#006a4e]" />;
      case 'Languages': return <Languages className="w-4 h-4 text-amber-600" />;
      case 'Sprout': return <Sprout className="w-4 h-4 text-[#006a4e]" />;
      default: return <Sparkles className="w-4 h-4 text-[#006a4e]" />;
    }
  };

  return (
    <div className="my-6">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#006a4e]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-serif">
          দ্রুত বিষয়সূচি ও টেমপ্লেট (Suggested Topics)
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_PROMPTS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex flex-col items-start p-3.5 bg-white hover:bg-green-50/50 rounded-xl border border-gray-200 hover:border-green-300 text-left transition shadow-2xs group"
          >
            <div className="flex items-center space-x-2 mb-1.5 w-full">
              <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-green-100 transition shrink-0">
                {getIcon(item.iconName)}
              </div>
              <span className="text-xs font-bold text-gray-800 group-hover:text-[#006a4e] truncate flex-1 font-serif">
                {item.titleBn}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug">
              {item.titleEn}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
