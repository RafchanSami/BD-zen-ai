import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import loadingVideoAsset from './Untitled design.mp4';

interface LoadingVideoProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingVideo: React.FC<LoadingVideoProps> = ({
  text = 'BD-Zen AI is thinking...',
  size = 'md',
}) => {
  const [hasVideoError, setHasVideoError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18',
  };

  return (
    <div className="flex items-center space-x-3.5 p-3.5 bg-white border border-emerald-200/90 rounded-2xl shadow-md text-gray-800 text-xs w-fit animate-fadeIn">
      {/* Video Container on White Background */}
      <div className={`relative overflow-hidden rounded-xl border border-emerald-300/60 bg-white shadow-xs shrink-0 flex items-center justify-center ${sizeClasses[size]}`}>
        {!hasVideoError ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover bg-white"
            onError={() => setHasVideoError(true)}
          >
            <source src={loadingVideoAsset} type="video/mp4" />
            <source src="/loadingvideo.mp4" type="video/mp4" />
            <source src="https://i.imgur.com/APyif3f.mp4" type="video/mp4" />
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-emerald-50">
            <Sparkles className="w-5 h-5 text-[#006a4e] animate-spin" />
          </div>
        )}
        
        {/* Subtle overlay border */}
        <div className="absolute inset-0 ring-1 ring-inset ring-emerald-500/10 rounded-xl pointer-events-none" />
      </div>

      {/* Text & Pulsing Indicator */}
      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5 font-bold text-[#006a4e]">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-[#006a4e]" />
          <span>{text}</span>
        </div>
        <span className="text-[10px] text-gray-500 font-medium">
          Generating response, please wait...
        </span>
      </div>
    </div>
  );
};
