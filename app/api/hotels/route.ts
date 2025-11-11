import { NextRequest, NextResponse } from 'next/server';
import { fetchHotelsFromAmap } from '@/lib/amap';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, amapKey } = body || {};
    if (!destination || !amapKey) {
      return NextResponse.json({ error: '缺少 destination 或 amapKey' }, { status: 400 });
    }
    const pois = await fetchHotelsFromAmap({ destination, amapKey, size: 4 });
    const hotels = pois.slice(0, 2).map((poi, idx) => {
      const [lng, lat] = (poi.location || '').split(',').map(Number);
      return {
        name: poi.name,
        rankLabel: poi.type ? `高德推荐 · ${poi.type}` : `高德推荐 #${idx + 1}`,
        rating: poi.biz_ext?.rating ? Number(poi.biz_ext.rating) : 4.6,
        pricePerNight: poi.biz_ext?.cost ? Number(poi.biz_ext.cost) : 1200,
        address: poi.address || `${poi.cityname || ''}${poi.adname || ''}`,
        lat: Number.isFinite(lat) ? lat : 0,
        lng: Number.isFinite(lng) ? lng : 0,
        tags: [poi.cityname, poi.adname].filter(Boolean),
      };
    });
    return NextResponse.json({ hotels });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '高德接口调用失败' }, { status: 500 });
  }
}
