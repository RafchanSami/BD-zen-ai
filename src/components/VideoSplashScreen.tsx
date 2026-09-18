import React, { useRef } from 'react';
import splashVideo from './Untitled design.mp4';

interface VideoSplashScreenProps {
  onDismiss: () => void;
}

export const VideoSplashScreen: React.FC<VideoSplashScreenProps> = ({ onDismiss }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div 
      onClick={onDismiss}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none animate-fadeIn"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={onDismiss}
        onError={onDismiss}
        className="w-full h-full object-cover bg-black"
      >
        <source src={splashVideo} type="video/mp4" />
        <source src="/splash.mp4" type="video/mp4" />
        <source src="/loadingvideo.mp4" type="video/mp4" />
      </video>
    </div>
  );
};
