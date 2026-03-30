// Marketing screenshot templates based on ASO research
// Science: First screenshot = 40% attention, story flow > isolated features

export interface MarketingTemplate {
  name: string;
  description: string;
  titlePosition: 'top' | 'center' | 'bottom';
  subtitlePosition: 'top' | 'center' | 'bottom';
  titleFontSize: number;
  subtitleFontSize: number;
  badgePosition?: 'top-left' | 'top-right' | 'bottom-center';
  gradient?: { from: string; to: string };
  padding: number; // percentage
}

export const MARKETING_TEMPLATES: Record<string, MarketingTemplate> = {
  'app-launch': {
    name: 'App Launch',
    description: 'Bold value proposition with gradient background',
    titlePosition: 'top',
    subtitlePosition: 'top',
    titleFontSize: 72,
    subtitleFontSize: 36,
    badgePosition: 'top-right',
    gradient: { from: '#667eea', to: '#764ba2' },
    padding: 5,
  },
  'feature-highlight': {
    name: 'Feature Highlight',
    description: 'Focus on a single killer feature',
    titlePosition: 'top',
    subtitlePosition: 'top',
    titleFontSize: 64,
    subtitleFontSize: 32,
    padding: 5,
  },
  'social-proof': {
    name: 'Social Proof',
    description: 'Rating, download count, testimonials overlay',
    titlePosition: 'bottom',
    subtitlePosition: 'bottom',
    titleFontSize: 56,
    subtitleFontSize: 28,
    badgePosition: 'top-left',
    padding: 5,
  },
  'before-after': {
    name: 'Before & After',
    description: 'Show the problem and your solution side by side',
    titlePosition: 'top',
    subtitlePosition: 'bottom',
    titleFontSize: 48,
    subtitleFontSize: 28,
    padding: 3,
  },
  'step-by-step': {
    name: 'Step by Step',
    description: 'Numbered steps showing how the app works',
    titlePosition: 'top',
    subtitlePosition: 'top',
    titleFontSize: 56,
    subtitleFontSize: 30,
    badgePosition: 'top-left',
    padding: 5,
  },
  'testimonial': {
    name: 'Testimonial',
    description: 'User quote with star rating',
    titlePosition: 'center',
    subtitlePosition: 'center',
    titleFontSize: 48,
    subtitleFontSize: 24,
    badgePosition: 'top-right',
    gradient: { from: '#1a1a2e', to: '#16213e' },
    padding: 8,
  },
};

export function getTemplate(name: string): MarketingTemplate | undefined {
  return MARKETING_TEMPLATES[name];
}

export function getTemplateNames(): string[] {
  return Object.keys(MARKETING_TEMPLATES);
}
