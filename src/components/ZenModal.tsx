import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, Sparkles, HeartPulse, RefreshCw } from 'lucide-react';

interface ZenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZenModal: React.FC<ZenModalProps> = ({ isOpen, onClose }) => {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [breathState, setBreathState] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathTimer, setBreathTimer] = useState(4);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Breathing Exercise Loop
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev <= 1) {
          setBreathState((curr) => {
            if (curr === 'Inhale') return 'Hold';
            if (curr === 'Hold') return 'Exhale';
            return 'Inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Ambient Nature Sound Synthesizer via Web Audio API (Rain / Pink Noise Stream)
  const toggleAmbientSound = () => {
    if (isAudioPlaying) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsAudioPlaying(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Create pink noise buffer for realistic soothing rain
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // gentle volume
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Low pass filter for soft rain ambient feel
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      const gain = ctx.createGain();
      gain.gain.value = 0.15;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      noiseNodeRef.current = whiteNoise;
      setIsAudioPlaying(true);
    } catch (e) {
      console.error('Audio synthesis error', e);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md">
      <div className="bg-emerald-950 text-white rounded-3xl border border-emerald-700 max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Background Zen Glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3 mb-5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold font-serif text-white">Zen Focus & Balance Mode</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-emerald-800 text-emerald-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breathing Exercise */}
        <div className="flex flex-col items-center justify-center py-6 bg-emerald-900/40 rounded-2xl border border-emerald-800/60 mb-5 relative">
          
          {/* Animated Circle */}
          <div
            className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 ${
              breathState === 'Inhale'
                ? 'scale-110 border-emerald-400 bg-emerald-800/40 text-emerald-200 shadow-lg shadow-emerald-500/20'
                : breathState === 'Hold'
                ? 'scale-105 border-amber-400 bg-amber-950/30 text-amber-200 shadow-md'
                : 'scale-90 border-emerald-600 bg-emerald-950/80 text-emerald-400'
            }`}
          >
            <span className="text-xs uppercase tracking-widest font-bold opacity-80">
              {breathState === 'Inhale' ? 'Inhale' : breathState === 'Hold' ? 'Hold' : 'Exhale'}
            </span>
            <span className="text-3xl font-extrabold mt-1 font-mono">
              {breathTimer}s
            </span>
          </div>

          <p className="text-xs text-emerald-300/80 mt-4 text-center px-4">
            Practice this 4-4-4 Zen breathing exercise to clear your mind and boost focus.
          </p>
        </div>

        {/* Ambient Nature Sound Controller */}
        <div className="p-4 bg-emerald-900/60 rounded-2xl border border-emerald-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-800 text-emerald-300">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-100">Zen Rain Sounds</h4>
              <p className="text-xs text-emerald-300/70">Background ambient sound for deep focus</p>
            </div>
          </div>

          <button
            onClick={toggleAmbientSound}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
              isAudioPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950'
            }`}
          >
            {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isAudioPlaying ? 'Pause' : 'Play'}</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center text-xs text-emerald-400/80">
          "When the mind is calm, thoughts and solutions are crystal clear."
        </div>

      </div>
    </div>
  );
};
