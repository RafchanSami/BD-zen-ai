export type MessageRole = 'user' | 'assistant';

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  sources?: GroundingSource[];
  language?: 'bn' | 'en' | 'banglish';
  isStreaming?: boolean;
  image?: string;
  imageSummary?: string;
  fileAttachment?: {
    name: string;
    type: 'pdf' | 'image' | 'text';
    dataUrl: string;
    size?: string;
  };
  pdfSummary?: string;
  pdfText?: string;
  isGeneratedImage?: boolean;
  feedback?: 'up' | 'down';
  suggestions?: string[];
}

export type PreferredLanguage = 'bn' | 'en' | 'banglish' | 'auto';
export type AIModel =
  | 'deepseek/deepseek-v4-flash-0731:free'
  | 'inclusionai/ling-3.0-flash-vl:free'
  | 'qwen/qwen3.8-27b';

export interface ChatConfig {
  enableSearch: boolean;
  language: PreferredLanguage;
  model: AIModel;
  speechRate: number;
}

export interface QuickPrompt {
  id: string;
  category: 'bd_info' | 'writing' | 'education' | 'tech' | 'culture';
  titleBn: string;
  titleEn: string;
  prompt: string;
  iconName: string;
}

export interface HeritageTopic {
  id: string;
  titleBn: string;
  titleEn: string;
  dateOrEra: string;
  summaryBn: string;
  summaryEn: string;
  detailsPrompt: string;
}
