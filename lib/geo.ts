type Coordinate = { lat: number; lng: number; address: string };

const preset: Record<string, Coordinate> = {
  '东京': { lat: 35.6762, lng: 139.6503, address: '日本东京都' },
  '大阪': { lat: 34.6937, lng: 135.5023, address: '日本大阪府' },
  '京都': { lat: 35.0116, lng: 135.7681, address: '日本京都府' },
  '札幌': { lat: 43.0618, lng: 141.3545, address: '日本北海道札幌市' },
  '冲绳': { lat: 26.2124, lng: 127.6809, address: '日本冲绳县那霸市' },
  '北京': { lat: 39.9042, lng: 116.4074, address: '中国北京市' },
  '上海': { lat: 31.2304, lng: 121.4737, address: '中国上海市' },
  '广州': { lat: 23.1291, lng: 113.2644, address: '中国广州市' },
  '深圳': { lat: 22.5431, lng: 114.0579, address: '中国深圳市' },
  '成都': { lat: 30.5728, lng: 104.0668, address: '中国成都市' },
  '重庆': { lat: 29.563, lng: 106.5516, address: '中国重庆市' },
  '香港': { lat: 22.3193, lng: 114.1694, address: '中国香港' },
  '新加坡': { lat: 1.3521, lng: 103.8198, address: '新加坡' },
  '首尔': { lat: 37.5665, lng: 126.978, address: '韩国首尔' },
  '巴黎': { lat: 48.8566, lng: 2.3522, address: '法国巴黎' },
  '伦敦': { lat: 51.5072, lng: -0.1276, address: '英国伦敦' },
  '纽约': { lat: 40.7128, lng: -74.006, address: '美国纽约' },
  '罗马': { lat: 41.9028, lng: 12.4964, address: '意大利罗马' },
};

const fallback: Coordinate = { lat: 39.9042, lng: 116.4074, address: '中国北京' };

export function guessCoords(query: string | undefined | null): Coordinate {
  if (!query) return fallback;
  const lowered = query.toLowerCase();
  const match = Object.entries(preset).find(([key]) => lowered.includes(key.toLowerCase()));
  return match ? match[1] : fallback;
}

