import { QuickPrompt, HeritageTopic } from '../types';

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'who_are_you',
    category: 'culture',
    titleBn: 'Who are you?',
    titleEn: 'Who are you?',
    prompt: 'Who are you and what is your primary purpose?',
    iconName: 'Sparkles'
  },
  {
    id: 'bd_history',
    category: 'bd_info',
    titleBn: '1971 Liberation War',
    titleEn: '1971 Liberation War',
    prompt: 'Explain the history and key significance of Bangladesh\'s 1971 Liberation War in concise bullet points.',
    iconName: 'Flag'
  },
  {
    id: 'bcs_prep',
    category: 'education',
    titleBn: 'BCS Exam Prep Guide',
    titleEn: 'BCS Exam Prep Guide',
    prompt: 'Provide an effective preparation strategy and roadmap for competitive civil service exams.',
    iconName: 'GraduationCap'
  },
  {
    id: 'formal_email',
    category: 'writing',
    titleBn: 'Formal Business Email',
    titleEn: 'Formal Business Email',
    prompt: 'Draft a polite, highly professional business email requesting leave of absence.',
    iconName: 'Mail'
  },
  {
    id: 'travel_bd',
    category: 'bd_info',
    titleBn: 'Top Tour Sites in BD',
    titleEn: 'Top Tour Sites in BD',
    prompt: 'Provide a budget-friendly 3-day travel itinerary for visiting Sajek Valley, Sundarbans, and Cox\'s Bazar.',
    iconName: 'Compass'
  },
  {
    id: 'digital_bd',
    category: 'tech',
    titleBn: 'Smart Bangladesh Vision',
    titleEn: 'Smart Bangladesh Vision',
    prompt: 'Explain the four core pillars of Smart Bangladesh and digital technology growth in Bangladesh.',
    iconName: 'Cpu'
  },
  {
    id: 'code_assistant',
    category: 'tech',
    titleBn: 'AI Code Assistant',
    titleEn: 'AI Code Assistant',
    prompt: 'Write a clean TypeScript React component for a responsive search bar with debounced input.',
    iconName: 'Code'
  },
  {
    id: 'agri_tech',
    category: 'tech',
    titleBn: 'Agri-Tech Innovations',
    titleEn: 'Agri-Tech Innovations',
    prompt: 'How are modern agriculture technology and AI mobile apps empowering farmers in developing nations?',
    iconName: 'Sprout'
  }
];

export const HERITAGE_TOPICS: HeritageTopic[] = [
  {
    id: 'language_movement',
    titleBn: '1952 Language Movement',
    titleEn: '1952 Language Movement',
    dateOrEra: '21st February 1952',
    summaryBn: 'Supreme sacrifice for mother tongue Bangla. Recognized globally as International Mother Language Day by UNESCO.',
    summaryEn: 'Supreme sacrifice for mother tongue Bangla. Recognized globally as International Mother Language Day by UNESCO.',
    detailsPrompt: 'Explain the background of the 1952 Language Movement and its global recognition as International Mother Language Day.'
  },
  {
    id: 'liberation_war',
    titleBn: '1971 Liberation War',
    titleEn: '1971 Liberation War',
    dateOrEra: '26 March - 16 December 1971',
    summaryBn: '9-month heroic war for freedom resulting in the independent sovereign nation of Bangladesh.',
    summaryEn: '9-month heroic war for freedom resulting in the independent sovereign nation of Bangladesh.',
    detailsPrompt: 'Explain the significance of 16th December Victory Day and the birth of Bangladesh as a sovereign nation.'
  },
  {
    id: 'pohela_boishakh',
    titleBn: 'Pohela Boishakh & Culture',
    titleEn: 'Pohela Boishakh & Culture',
    dateOrEra: '14th April (1st Boishakh)',
    summaryBn: 'Bengali New Year celebrated with colorful Mangal Shobhajatra, recognized by UNESCO.',
    summaryEn: 'Bengali New Year celebrated with colorful Mangal Shobhajatra, recognized by UNESCO.',
    detailsPrompt: 'Explain the cultural significance of Pohela Boishakh, Mangal Shobhajatra, and traditional celebrations.'
  },
  {
    id: 'national_symbols',
    titleBn: 'National Symbols of Bangladesh',
    titleEn: 'National Symbols of Bangladesh',
    dateOrEra: 'Bangladesh Heritage',
    summaryBn: 'Jackfruit, Water Lily, Magpie-robin, Royal Bengal Tiger, Hilsa fish, and Kabaddi.',
    summaryEn: 'Jackfruit, Water Lily, Magpie-robin, Royal Bengal Tiger, Hilsa fish, and Kabaddi.',
    detailsPrompt: 'Discuss the national symbols of Bangladesh and the ecological importance of the Sundarbans mangrove forest.'
  }
];
