import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { HeritageDrawer } from './components/HeritageDrawer';
import { ZenModal } from './components/ZenModal';
import { AuthModal } from './components/AuthModal';
import { LoadingVideo } from './components/LoadingVideo';
import { VideoSplashScreen } from './components/VideoSplashScreen';
import { AuthProvider } from './context/AuthContext';
import { useRealtimeChat } from './lib/useRealtimeChat';
import { ChatMessage as ChatMessageType, PreferredLanguage, AIModel } from './types';
import { AccentTheme, getSavedTheme, applyTheme } from './lib/theme';
import { Sparkles, Flag } from 'lucide-react';

function MainApp() {
  const {
    sessions,
    activeSessionId,
    currentMessages,
    syncMessages,
    updateLocalMessages,
    startNewSession,
    selectSession,
    clearCurrentChat,
  } = useRealtimeChat();

  const [enableSearch, setEnableSearch] = useState<boolean>(true);
  const [language, setLanguage] = useState<PreferredLanguage>('en');
  const [model, setModel] = useState<AIModel>('deepseek/deepseek-v4-flash-0731:free');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<AccentTheme>(getSavedTheme);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isHeritageOpen, setIsHeritageOpen] = useState<boolean>(false);
  const [isZenOpen, setIsZenOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleSelectTheme = (theme: AccentTheme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('To install BD-Zen AI on your device, use your browser\'s "Add to Home Screen" or "Install App" option.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isLoading]);

  const handleSendMessage = async (text: string, image?: string, fileAttachment?: any) => {
    if ((!text.trim() && !image && !fileAttachment) || isLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      image: image,
      fileAttachment: fileAttachment,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...currentMessages, userMessage];
    await syncMessages(newMessages);
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantPlaceholder: ChatMessageType = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    let updatedWithPlaceholder = [...newMessages, assistantPlaceholder];
    await syncMessages(updatedWithPlaceholder);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            image: m.image,
            imageSummary: m.imageSummary,
            fileAttachment: m.fileAttachment,
            pdfSummary: m.pdfSummary,
            pdfText: m.pdfText,
          })),
          enableSearch,
          language,
          model,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let accumulatedSources: any[] = [];
      let accumulatedSuggestions: string[] = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed === 'data: [DONE]') {
            break;
          }

          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.imageSummary || parsed.pdfSummary) {
                updatedWithPlaceholder = updatedWithPlaceholder.map((msg) =>
                  msg.id === userMessage.id
                    ? {
                        ...msg,
                        imageSummary: parsed.imageSummary || msg.imageSummary,
                        pdfSummary: parsed.pdfSummary || msg.pdfSummary,
                        pdfText: parsed.pdfText || msg.pdfText,
                      }
                    : msg
                );
                updateLocalMessages(updatedWithPlaceholder);
              }
              if (parsed.text) {
                accumulatedText += parsed.text;
                updatedWithPlaceholder = updatedWithPlaceholder.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: accumulatedText, sources: accumulatedSources, isStreaming: true }
                    : msg
                );
                updateLocalMessages(updatedWithPlaceholder);
              }
              if (parsed.sources && Array.isArray(parsed.sources)) {
                accumulatedSources = parsed.sources;
                updatedWithPlaceholder = updatedWithPlaceholder.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, sources: accumulatedSources }
                    : msg
                );
                updateLocalMessages(updatedWithPlaceholder);
              }
              if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                accumulatedSuggestions = parsed.suggestions;
                updatedWithPlaceholder = updatedWithPlaceholder.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, suggestions: accumulatedSuggestions }
                    : msg
                );
                updateLocalMessages(updatedWithPlaceholder);
              }
            } catch (e) {
              // Ignore partial chunk parsing errors
            }
          }
        }
      }

      // Mark streaming complete
      const finalStreamedMessages = updatedWithPlaceholder.map((msg) =>
        msg.id === assistantId
          ? {
              ...msg,
              content: accumulatedText || 'Sorry, unable to generate a response.',
              sources: accumulatedSources,
              suggestions: accumulatedSuggestions.length > 0 ? accumulatedSuggestions : undefined,
              isStreaming: false,
            }
          : msg
      );
      await syncMessages(finalStreamedMessages);

    } catch (streamErr) {
      console.warn('Streaming failed, resorting to standard API:', streamErr);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
              image: m.image,
              imageSummary: m.imageSummary,
              fileAttachment: m.fileAttachment,
              pdfSummary: m.pdfSummary,
              pdfText: m.pdfText,
            })),
            enableSearch,
            language,
            model,
          }),
        });

        const data = await response.json().catch(() => null);

        if (data?.imageSummary || data?.pdfSummary) {
          updatedWithPlaceholder = updatedWithPlaceholder.map((msg) =>
            msg.id === userMessage.id
              ? {
                  ...msg,
                  imageSummary: data.imageSummary || msg.imageSummary,
                  pdfSummary: data.pdfSummary || msg.pdfSummary,
                  pdfText: data.pdfText || msg.pdfText,
                }
              : msg
          );
        }

        if (!response.ok || !data) {
          const serverError =
            data?.content ||
            data?.fallbackResponse ||
            data?.error ||
            `Sorry, an issue occurred (Status: ${response.status}).`;

          const errorMessages = updatedWithPlaceholder.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: serverError,
                  isStreaming: false,
                }
              : msg
          );
          await syncMessages(errorMessages);
          return;
        }

        const finalMessages = updatedWithPlaceholder.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: data.content || 'Sorry, unable to generate a response.',
                image: data.generatedImage || data.imageUrl || undefined,
                isGeneratedImage: !!(data.generatedImage || data.imageUrl),
                sources: data.sources || [],
                suggestions: data.suggestions || undefined,
                isStreaming: false,
              }
            : msg
        );

        await syncMessages(finalMessages);
      } catch (err: any) {
        console.error('Error fetching chat response:', err);
        const errorMessages = updatedWithPlaceholder.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  'Sorry, error connecting to network or server. Please try again.',
                isStreaming: false,
              }
            : msg
        );
        await syncMessages(errorMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearCurrentChat();
    }
  };

  const handleDownloadChat = () => {
    if (!currentMessages || currentMessages.length === 0) {
      alert('No messages to export.');
      return;
    }

    const exportDate = new Date().toLocaleString();
    let markdownContent = `# BD-Zen AI - Chat Export\n\n`;
    markdownContent += `**Export Date:** ${exportDate}\n`;
    markdownContent += `**Model:** ${model}\n`;
    markdownContent += `**Language:** ${language}\n\n`;
    markdownContent += `---\n\n`;

    currentMessages.forEach((msg) => {
      const roleDisplayName = msg.role === 'user' ? '👤 User' : '🤖 BD-Zen AI';
      markdownContent += `### ${roleDisplayName} (${msg.timestamp})\n\n`;
      markdownContent += `${msg.content}\n\n`;

      if (msg.sources && msg.sources.length > 0) {
        markdownContent += `**Sources:**\n`;
        msg.sources.forEach((s) => {
          markdownContent += `- [${s.title}](${s.url})\n`;
        });
        markdownContent += `\n`;
      }

      markdownContent += `---\n\n`;
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BD-Zen-AI-Chat-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFeedback = async (messageId: string, feedback: 'up' | 'down' | undefined) => {
    const updatedMessages = currentMessages.map((msg) =>
      msg.id === messageId ? { ...msg, feedback } : msg
    );
    await syncMessages(updatedMessages);
  };

  return (
    <div className="flex h-screen w-full bg-[#fdfdfd] overflow-hidden font-sans text-gray-800">
      
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        enableSearch={enableSearch}
        setEnableSearch={setEnableSearch}
        language={language}
        setLanguage={setLanguage}
        model={model}
        setModel={setModel}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onStartNewSession={startNewSession}
        onClearChat={handleClearChat}
        onOpenZenModal={() => setIsZenOpen(true)}
        onOpenHeritageDrawer={() => setIsHeritageOpen(true)}
        onSelectPrompt={handleSendMessage}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onInstallPWA={handleInstallPWA}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          enableSearch={enableSearch}
          setEnableSearch={setEnableSearch}
          language={language}
          setLanguage={setLanguage}
          model={model}
          setModel={setModel}
          onClearChat={handleClearChat}
          onDownloadChat={handleDownloadChat}
          onOpenZenModal={() => setIsZenOpen(true)}
          onOpenHeritageDrawer={() => setIsHeritageOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onInstallPWA={handleInstallPWA}
        />

        {/* Scrollable Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Chat Messages */}
            <div className="space-y-4">
              {currentMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onSelectPrompt={handleSendMessage}
                  onFeedback={handleFeedback}
                />
              ))}

              {/* Loading Video Indicator */}
              {isLoading && <LoadingVideo text="BD-Zen AI is thinking..." />}

              <div ref={messagesEndRef} />
            </div>

          </div>
        </main>

        {/* Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          language={language}
          enableSearch={enableSearch}
        />

      </div>

      {/* Modals & Drawers */}
      <HeritageDrawer
        isOpen={isHeritageOpen}
        onClose={() => setIsHeritageOpen(false)}
        onSelectPrompt={handleSendMessage}
      />

      <ZenModal
        isOpen={isZenOpen}
        onClose={() => setIsZenOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {showSplash && (
        <VideoSplashScreen onDismiss={() => setShowSplash(false)} />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

