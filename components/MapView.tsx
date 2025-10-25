"use client";
import { useEffect, useRef, useState } from 'react';
import { getSettings } from '@/lib/storage';

type Marker = { lat: number; lng: number; title?: string };

export default function MapView({ markers = [] as Marker[], centerQuery }: { markers?: Marker[]; centerQuery?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const s = await getSettings();
      const provider = s.mapProvider || 'amap';
      const apiKey = s.mapApiKey;
      if (!apiKey) { setError('设置中未配置地图 API Key'); return; }

      const existing = document.querySelector(`#sdk-${provider}`) as HTMLScriptElement | null;
      if (!existing) {
        const script = document.createElement('script');
        script.id = `sdk-${provider}`;
        if (provider === 'amap') {
          script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`;
        } else {
          // Baidu v3.0 GL
          script.src = `https://api.map.baidu.com/api?v=3.0&ak=${apiKey}`;
        }
        script.async = true;
        script.onload = () => setLoaded(true);
        script.onerror = () => setError('地图 SDK 加载失败');
        document.body.appendChild(script);
      } else {
        setLoaded(true);
      }
    })();
    return () => { canceled = true; };
  }, []);

  useEffect(() => {
    if (!loaded || !ref.current) return;
    (async () => {
      const s = await getSettings();
      const provider = s.mapProvider || 'amap';
      if (provider === 'amap') {
        const AMap = (window as any).AMap;
        if (!AMap) return;
        const map = new AMap.Map(ref.current, { zoom: 11, viewMode: '3D' });
        markers.forEach(m => new AMap.Marker({ position: [m.lng, m.lat], title: m.title, map }));
        if (markers.length) {
          map.setFitView();
        } else if (centerQuery) {
          AMap.plugin('AMap.Geocoder', () => {
            const geocoder = new AMap.Geocoder();
            geocoder.getLocation(centerQuery, (status: string, result: any) => {
              const loc = result?.geocodes?.[0]?.location;
              if (loc) {
                map.setZoom(12);
                map.setCenter(loc);
              }
            });
          });
        }
      } else {
        const BMap = (window as any).BMapGL || (window as any).BMap;
        if (!BMap) return;
        const map = new BMap.Map(ref.current);
        map.centerAndZoom(new BMap.Point(116.404, 39.915), 11);
        markers.forEach(m => {
          const pt = new BMap.Point(m.lng, m.lat);
          map.addOverlay(new BMap.Marker(pt));
        });
        if (!markers.length && centerQuery) {
          const geocoder = new BMap.Geocoder();
          geocoder.getPoint(centerQuery, (point: any) => {
            if (point) {
              map.centerAndZoom(point, 12);
            }
          });
        }
      }
    })();
  }, [loaded, markers, centerQuery]);

  if (error) return <div className="card">{error}</div>;
  return <div className="map" ref={ref} />;
}
