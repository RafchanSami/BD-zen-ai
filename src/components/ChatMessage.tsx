import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Volume2, VolumeX, ExternalLink, User, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';
import { CodeBlock } from './CodeBlock';

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectPrompt?: (prompt: string) => void;
  onFeedback?: (messageId: string, feedback: 'up' | 'down' | undefined) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSelectPrompt, onFeedback }) => {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(message.feedback || null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>(message.suggestions || []);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const isAssistant = message.role === 'assistant';

  // Load or dynamically generate AI follow-up suggestions
  useEffect(() => {
    if (message.suggestions && message.suggestions.length > 0) {
      setAiSuggestions(message.suggestions);
      return;
    }

    // Only fetch if suggestions were not provided by the stream/response
    if (isAssistant && !message.isStreaming && message.content && message.content.length > 10 && aiSuggestions.length === 0) {
      let isMounted = true;
      setIsLoadingSuggestions(true);

      fetch('/api/chat/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message.content }),
      })
        .then((res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then((data) => {
          if (isMounted && data?.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setAiSuggestions(data.suggestions);
          }
        })
        .catch(() => {
          // Gracefully ignore network hiccups
        })
        .finally(() => {
          if (isMounted) setIsLoadingSuggestions(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [message.suggestions, message.isStreaming, message.content, isAssistant, aiSuggestions.length]);

  const handleFeedback = (type: 'up' | 'down') => {
    const nextFeedback = feedback === type ? null : type;
    setFeedback(nextFeedback);
    if (onFeedback) {
      onFeedback(message.id, nextFeedback || undefined);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.content);
      
      const voices = window.speechSynthesis.getVoices();
      const bnVoice = voices.find(v => v.lang.startsWith('bn'));
      if (bnVoice) {
        utterance.voice = bnVoice;
      }

      utterance.rate = 0.95;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex items-start space-x-3.5 max-w-4xl ${!isAssistant && 'flex-row-reverse space-x-reverse'}`}>
        
        {/* Avatar */}
        <div
          className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-2xs ${
            isAssistant
              ? 'bg-[#006a4e] border border-[#005a42]'
              : 'bg-gray-200 text-gray-700 border border-gray-300'
          }`}
        >
          {isAssistant ? (
            <div className="w-5 h-5 rounded-full bg-[#f42a41] flex items-center justify-center shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
          ) : (
            <User className="w-5 h-5 text-gray-600" />
          )}
        </div>

        {/* Message Card Container */}
        <div
          className={`p-5 sm:p-6 rounded-2xl shadow-2xs ${
            isAssistant
              ? 'bg-white border border-gray-200 rounded-tl-none max-w-3xl text-gray-800'
              : 'bg-gray-100 border border-gray-200 rounded-tr-none max-w-xl text-gray-800 font-medium'
          }`}
        >
          {/* Header info */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2 pb-1 border-b border-gray-100">
            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
              {isAssistant ? 'BD-Zen AI' : 'You'}
              {isAssistant && (
                <span className="text-[10px] bg-green-50 text-[#006a4e] px-2 py-0.5 rounded font-bold border border-green-200">
                  Smart AI
                </span>
              )}
            </span>
            <span className="text-[11px] text-gray-400">{message.timestamp}</span>
          </div>

          {/* Text Content */}
          <div className="text-gray-700 leading-relaxed text-sm space-y-3">
            {isAssistant ? (
              <>
                {message.content ? (
                  <div className="prose prose-emerald prose-sm max-w-none text-gray-700 font-sans">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mt-3 mb-1.5 font-serif border-b border-gray-200 pb-1">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold text-gray-800 mt-2.5 mb-1 font-serif">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold text-[#006a4e] mt-2 mb-1">{children}</h3>,
                        p: ({ children }) => <p className="mb-2 text-gray-700 leading-relaxed font-medium">{children}</p>,
                        ul: ({ children }) => <ul className="space-y-2 mb-3 pl-1 text-gray-600">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-3 pl-1 text-gray-600">{children}</ol>,
                        li: ({ children }) => (
                          <li className="flex items-start space-x-2">
                            <span className="text-[#f42a41] font-bold text-base leading-none mt-0.5">•</span>
                            <div className="flex-1">{children}</div>
                          </li>
                        ),
                        strong: ({ children }) => <strong className="font-bold text-gray-900 bg-gray-50 px-1 rounded">{children}</strong>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-[#006a4e] pl-3 py-1.5 bg-green-50/50 rounded-r text-gray-800 my-2 italic">
                            {children}
                          </blockquote>
                        ),
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeContent = String(children).replace(/\n$/, '');
                          const isMultiLine = codeContent.includes('\n') || !!match;

                          if (!inline && isMultiLine) {
                            return (
                              <CodeBlock
                                language={match ? match[1] : undefined}
                                value={codeContent}
                              />
                            );
                          }

                          return (
                            <code className="bg-emerald-50/80 text-[#006a4e] px-1.5 py-0.5 rounded text-xs font-mono font-semibold border border-emerald-200/60" {...props}>
                              {children}
                            </code>
                          );
                        },
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3 border border-gray-200 rounded-xl">
                            <table className="min-w-full divide-y divide-gray-200 text-xs text-gray-700">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-gray-50 font-semibold text-gray-900">{children}</thead>,
                        th: ({ children }) => <th className="px-3.5 py-2.5 text-left">{children}</th>,
                        td: ({ children }) => <td className="px-3.5 py-2 border-t border-gray-100">{children}</td>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : message.isStreaming ? (
                  <div className="flex items-center space-x-2.5 py-1.5 text-xs text-[#006a4e]">
                    <div className="flex space-x-1 items-center">
                      <span className="w-2 h-2 bg-[#006a4e] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-[#006a4e] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-[#006a4e] rounded-full animate-bounce"></span>
                    </div>
                    <span className="text-xs text-emerald-800 font-semibold tracking-wide">BD-Zen AI is typing...</span>
                  </div>
                ) : null}

                {/* Typing animation below active streaming content */}
                {message.isStreaming && message.content && (
                  <div className="mt-2.5 flex items-center space-x-2 text-xs text-[#006a4e] bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-1 rounded-lg w-fit animate-pulse">
                    <div className="flex space-x-1 items-center">
                      <span className="w-1.5 h-1.5 bg-[#006a4e] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#006a4e] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#006a4e] rounded-full animate-bounce"></span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800">BD-Zen AI is typing...</span>
                  </div>
                )}
              </>
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            )}
          </div>

          {/* Web Search Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="text-[11px] font-bold text-[#006a4e] mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#006a4e]" />
                Sources (Google Web Grounding):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[11px] bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-[#006a4e] px-2.5 py-1 rounded-md border border-gray-200 hover:border-green-300 transition truncate max-w-xs"
                  >
                    <span className="truncate">{src.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AI-Generated Suggested Follow-ups */}
          {isAssistant && !message.isStreaming && message.content && (
            <div className="mt-4 pt-3 border-t border-gray-100/80 space-y-2">
              <div className="flex items-center space-x-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Suggested Follow-ups (AI Generated)</span>
              </div>

              {isLoadingSuggestions && aiSuggestions.length === 0 ? (
                <div className="flex items-center space-x-2 text-xs text-gray-400 py-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                  <span>Generating follow-up questions...</span>
                </div>
              ) : aiSuggestions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {aiSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectPrompt && onSelectPrompt(suggestion)}
                      className="inline-flex items-center space-x-1.5 text-xs bg-emerald-50/80 hover:bg-[#006a4e] text-[#006a4e] hover:text-white px-3 py-1.5 rounded-xl border border-emerald-200/80 hover:border-transparent transition shadow-2xs group text-left cursor-pointer"
                    >
                      <span>{suggestion}</span>
                      <Sparkles className="w-3 h-3 text-emerald-600 group-hover:text-white transition shrink-0" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Action Bar */}
          {isAssistant && (
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 mt-2">
              <div className="flex items-center space-x-2.5 sm:space-x-3 flex-wrap gap-y-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center text-xs text-gray-500 hover:text-[#006a4e] transition cursor-pointer"
                  title="Copy response text"
                >
                  {copied ? <Check className="w-4 h-4 mr-1 text-[#006a4e]" /> : <Copy className="w-4 h-4 mr-1" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleSpeak}
                  className={`flex items-center text-xs transition cursor-pointer ${
                    isPlaying ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-[#f42a41]'
                  }`}
                  title="Listen to audio read"
                >
                  {isPlaying ? <VolumeX className="w-4 h-4 mr-1" /> : <Volume2 className="w-4 h-4 mr-1" />}
                  <span>{isPlaying ? 'Stop' : 'Listen'}</span>
                </button>
              </div>

              {/* Reaction Buttons */}
              <div className="flex items-center space-x-1.5 pl-3 border-l border-gray-100">
                <button
                  onClick={() => handleFeedback('up')}
                  className={`p-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer ${
                    feedback === 'up'
                      ? 'text-[#006a4e] bg-emerald-50 border border-emerald-200 font-semibold'
                      : 'text-gray-400 hover:text-[#006a4e] hover:bg-gray-100'
                  }`}
                  title="Helpful response"
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${feedback === 'up' ? 'fill-[#006a4e]' : ''}`} />
                </button>

                <button
                  onClick={() => handleFeedback('down')}
                  className={`p-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer ${
                    feedback === 'down'
                      ? 'text-red-600 bg-red-50 border border-red-200 font-semibold'
                      : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
                  }`}
                  title="Needs improvement"
                >
                  <ThumbsDown className={`w-3.5 h-3.5 ${feedback === 'down' ? 'fill-red-600' : ''}`} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
