export type AMapPOI = {
    id: string;
    name: string;
    address: string;
    location?: string;
    tel?: string;
    type?: string;
    adname?: string;
    cityname?: string;
    biz_ext?: { rating?: string; cost?: string };
  };
  const MODE_MAP: Record<string, string> = {
    地铁: '#0071e3',
    公交: '#10b981',
    高铁: '#f97316',
    火车: '#9333ea',
    步行: '#f43f5e',
    出租车: '#facc15',
  };
  export function modeColor(mode?: string): string {
    if (!mode) return '#94a3b8';
    return MODE_MAP[mode as keyof typeof MODE_MAP] ?? '#94a3b8';
  }
  export async function fetchHotelsFromAmap(opts: { destination: string; amapKey: string; size?: number }) {
    const { destination, amapKey, size = 2 } = opts;
    const url = new URL('https://restapi.amap.com/v3/place/text');
    url.searchParams.set('keywords', `${destination} 酒店`);
    url.searchParams.set('types', '住宿服务');
    url.searchParams.set('city', destination);
    url.searchParams.set('citylimit', 'true');
    url.searchParams.set('children', '1');
    url.searchParams.set('offset', String(size));
    url.searchParams.set('page', '1');
    url.searchParams.set('extensions', 'all');
    url.searchParams.set('output', 'json');
    url.searchParams.set('key', amapKey);
    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`高德 API 调用失败: ${res.status}`);
    }
    const data = await res.json();
    if (data.status !== '1') {
      throw new Error(data.info || '高德 API 返回异常');
    }
    return (data.pois as AMapPOI[]) ?? [];
  }