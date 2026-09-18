export type AccentTheme = 'green' | 'blue' | 'purple' | 'red' | 'teal' | 'amber';

export interface ThemeOption {
  id: AccentTheme;
  nameBn: string;
  nameEn: string;
  primaryColor: string;
  darkColor: string;
  lightBg: string;
  borderColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'green',
    nameBn: 'বিডি-জেন গ্রিন (ডিফল্ট)',
    nameEn: 'BD-Zen Green (Default)',
    primaryColor: '#006a4e',
    darkColor: '#00503a',
    lightBg: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  {
    id: 'blue',
    nameBn: 'স্যফায়ার ব্লু',
    nameEn: 'Sapphire Blue',
    primaryColor: '#1d4ed8',
    darkColor: '#1e3a8a',
    lightBg: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  {
    id: 'purple',
    nameBn: 'রয়েল পার্পল',
    nameEn: 'Royal Purple',
    primaryColor: '#7e22ce',
    darkColor: '#581c87',
    lightBg: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  {
    id: 'red',
    nameBn: 'ক্রিমসন রেড',
    nameEn: 'Crimson Red',
    primaryColor: '#f42a41',
    darkColor: '#b91c1c',
    lightBg: '#fff1f2',
    borderColor: '#fecdd3',
  },
  {
    id: 'teal',
    nameBn: 'টিলে ওশান',
    nameEn: 'Teal Ocean',
    primaryColor: '#0f766e',
    darkColor: '#115e59',
    lightBg: '#f0fdfa',
    borderColor: '#99f6e4',
  },
  {
    id: 'amber',
    nameBn: 'গোল্ডেন আম্বার',
    nameEn: 'Golden Amber',
    primaryColor: '#d97706',
    darkColor: '#92400e',
    lightBg: '#fffbeb',
    borderColor: '#fde68a',
  },
];

export const applyTheme = (themeId: AccentTheme) => {
  const selectedTheme = THEME_OPTIONS.find((t) => t.id === themeId) || THEME_OPTIONS[0];
  const root = document.documentElement;

  root.style.setProperty('--brand-primary', selectedTheme.primaryColor);
  root.style.setProperty('--brand-dark', selectedTheme.darkColor);
  root.style.setProperty('--brand-light-bg', selectedTheme.lightBg);
  root.style.setProperty('--brand-border', selectedTheme.borderColor);

  try {
    localStorage.setItem('bdzen_accent_theme', themeId);
  } catch (e) {
    // Ignore localStorage errors
  }
};

export const getSavedTheme = (): AccentTheme => {
  try {
    const saved = localStorage.getItem('bdzen_accent_theme') as AccentTheme;
    if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
      return saved;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return 'green';
};
