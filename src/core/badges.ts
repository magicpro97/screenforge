export interface Badge {
  text: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  padding: number;
  borderRadius: number;
}

export const PRESET_BADGES: Record<string, Badge> = {
  'new': { text: 'NEW', backgroundColor: '#e74c3c', textColor: '#ffffff', fontSize: 24, padding: 12, borderRadius: 8 },
  'free': { text: 'FREE', backgroundColor: '#27ae60', textColor: '#ffffff', fontSize: 24, padding: 12, borderRadius: 8 },
  'top': { text: '#1', backgroundColor: '#f39c12', textColor: '#ffffff', fontSize: 28, padding: 12, borderRadius: 8 },
  'rated': { text: '4.8★', backgroundColor: '#2980b9', textColor: '#ffffff', fontSize: 22, padding: 12, borderRadius: 8 },
  'popular': { text: '10M+', backgroundColor: '#8e44ad', textColor: '#ffffff', fontSize: 22, padding: 12, borderRadius: 8 },
  'sale': { text: 'SALE', backgroundColor: '#e74c3c', textColor: '#ffffff', fontSize: 24, padding: 12, borderRadius: 8 },
  'award': { text: '🏆 Award', backgroundColor: '#f39c12', textColor: '#ffffff', fontSize: 22, padding: 12, borderRadius: 8 },
};

export function getBadge(name: string): Badge | undefined {
  return PRESET_BADGES[name];
}

export function getBadgeNames(): string[] {
  return Object.keys(PRESET_BADGES);
}

export function createBadgeSvg(badge: Badge, position: 'top-left' | 'top-right' | 'bottom-center', imageWidth: number, imageHeight: number): string {
  const textWidth = badge.text.length * badge.fontSize * 0.6 + badge.padding * 2;
  const height = badge.fontSize + badge.padding * 2;

  let x: number, y: number;
  switch (position) {
    case 'top-left':
      x = 20; y = 20; break;
    case 'top-right':
      x = imageWidth - textWidth - 20; y = 20; break;
    case 'bottom-center':
      x = (imageWidth - textWidth) / 2; y = imageHeight - height - 20; break;
  }

  return `<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${x}" y="${y}" width="${textWidth}" height="${height}" rx="${badge.borderRadius}" fill="${badge.backgroundColor}" />
    <text x="${x + textWidth / 2}" y="${y + height / 2 + badge.fontSize * 0.35}" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="${badge.fontSize}" font-weight="700" fill="${badge.textColor}" text-anchor="middle">${badge.text}</text>
  </svg>`;
}
