import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { PreferredLanguage } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  language: PreferredLanguage;
  enableSearch?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  language,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Please type your query.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      if (language === 'bn') {
        recognition.lang = 'bn-BD';
      } else if (language === 'en') {
        recognition.lang = 'en-US';
      } else {
        recognition.lang = 'bn-BD';
      }

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSubmit = input.trim().length > 0 && !isLoading;

  return (
    <div className="p-2 sm:p-3 bg-white border-t border-gray-100 sticky bottom-0 z-20">
      <div className="max-w-xl mx-auto space-y-1.5">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <div
            className={`w-full flex items-center px-3.5 py-1.5 bg-gray-50/90 border rounded-full transition-all shadow-2xs ${
              isListening
                ? 'border-red-500 ring-2 ring-red-100'
                : 'border-gray-200 focus-within:ring-1.5 focus-within:ring-[#006a4e] focus-within:border-transparent focus-within:bg-white'
            }`}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                language === 'bn'
                  ? 'বিডি-জেন এআইকে যেকোনো প্রশ্ন করুন...'
                  : 'Ask BD-Zen AI anything...'
              }
              rows={1}
              disabled={isLoading}
              className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 resize-none max-h-24 min-h-[22px] text-xs sm:text-sm text-gray-800 placeholder-gray-400 py-0.5 outline-none px-1"
            />

            <div className="flex items-center space-x-1 shrink-0 ml-1">
              {/* Mic Icon */}
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? 'Stop Listening' : 'Voice Input'}
                className={`p-1.5 rounded-full transition ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              {/* Send Icon Button */}
              <button
                type="submit"
                disabled={!canSubmit}
                className={`p-1.5 rounded-full transition flex items-center justify-center ${
                  canSubmit
                    ? 'bg-[#006a4e] text-white hover:bg-[#005a42] shadow-2xs'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

        <p className="text-center text-[10px] text-gray-400">
          {language === 'bn'
            ? 'বিডি-জেন এআই বাংলাদেশ ও বৈশ্বিক তথ্যে সর্বদা প্রস্তুত।'
            : 'BD-Zen AI is ready to assist with knowledge, coding, and answers.'}
        </p>
      </div>
    </div>
  );
};
