"use client";
import { useEffect, useRef, useState } from 'react';
import { getSettings } from '@/lib/storage';

type Marker = { lat: number; lng: number; title?: string };
type Waypoint = { lat?: number; lng?: number; name?: string; title?: string; day?: number };

export default function MapView({ markers = [] as Marker[], centerQuery, waypoints = [] as Waypoint[], routeMode = 'polyline' as 'polyline' | 'driving' | 'walking' }: { markers?: Marker[]; centerQuery?: string; waypoints?: Waypoint[]; routeMode?: 'polyline' | 'driving' | 'walking' }) {
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
        // markers
        markers.forEach(m => new AMap.Marker({ position: [m.lng, m.lat], title: m.title, map }));
        // route from waypoints (polyline)
        const resolveWaypoints = async () => {
          const coords: { lng: number; lat: number; title?: string; day?: number; name?: string }[] = [];
          const needGeocode = waypoints.filter(w => !w.lat || !w.lng);
          if (needGeocode.length > 0) {
            await new Promise<void>(res => AMap.plugin('AMap.Geocoder', () => res()));
            const geocoder = new AMap.Geocoder();
            for (const w of waypoints) {
              if (w.lat != null && w.lng != null) {
                coords.push({ lng: w.lng!, lat: w.lat!, title: w.title, day: w.day, name: w.name });
              } else if (w.name) {
                const p: any = await new Promise(ok => geocoder.getLocation(w.name!, (status: string, result: any) => ok({ status, result })));
                const loc = (p as any)?.result?.geocodes?.[0]?.location;
                if (loc) coords.push({ lng: loc.lng, lat: loc.lat, title: w.title, day: w.day, name: w.name });
              }
            }
          } else {
            for (const w of waypoints) coords.push({ lng: w.lng!, lat: w.lat!, title: w.title, day: w.day, name: w.name });
          }
          return coords;
        };
        if (waypoints.length > 0) {
          const resolved = await resolveWaypoints();
          const infoWindow = new AMap.InfoWindow({ offset: new AMap.Pixel(0, -28) });
          const icon = new AMap.Icon({
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
            size: new AMap.Size(19, 33),
            imageSize: new AMap.Size(19, 33),
          });
          resolved.forEach(({ lng, lat, title, day, name }, idx) => {
            const labelText = String(day ?? idx + 1);
            const marker = new AMap.Marker({
              position: [lng, lat],
              map,
              title: name || title,
              icon,
              anchor: 'bottom-center',
            });
            marker.setLabel({
              direction: 'top',
              offset: new AMap.Pixel(0, -4),
              content: `<div class="map-label">#${labelText}</div>`,
            });
            marker.on('mouseover', () => {
              infoWindow.setContent(`<div class="map-tooltip">#${labelText} · ${name || title || ''}</div>`);
              infoWindow.open(map, marker.getPosition());
            });
            marker.on('mouseout', () => infoWindow.close());
          });
          if (resolved.length > 1) {
            const polyline = new AMap.Polyline({ path: resolved.map(p => [p.lng, p.lat]), strokeColor: '#0071e3', strokeWeight: 4, showDir: true });
            map.add(polyline);
            map.setFitView([polyline]);
          } else if (resolved.length === 1) {
            map.setZoom(13);
            map.setCenter([resolved[0].lng, resolved[0].lat]);
          }
        }
        if (!markers.length && !waypoints.length && centerQuery) {
          await new Promise<void>(res => AMap.plugin('AMap.Geocoder', () => res()));
          const geocoder = new AMap.Geocoder();
          geocoder.getLocation(centerQuery, (status: string, result: any) => {
            const loc = result?.geocodes?.[0]?.location;
            if (loc) { map.setZoom(12); map.setCenter(loc); }
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
        if (waypoints.length > 0) {
          const geocoder = new (BMap as any).Geocoder();
          const icon = new (BMap as any).Icon('https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png', new BMap.Size(19, 33), {
            anchor: new BMap.Size(9, 33),
          });
          const points: { point: any; day?: number; name?: string }[] = [];
          for (const w of waypoints) {
            if (w.lat != null && w.lng != null) {
              const point = new BMap.Point(w.lng!, w.lat!);
              points.push({ point, day: w.day, name: w.name });
            } else if (w.name) {
              await new Promise<void>(ok => geocoder.getPoint(w.name!, (pt: any) => { if (pt) points.push({ point: pt, day: w.day, name: w.name }); ok(); }));
            }
          }
          points.forEach(({ point, day, name }, idx) => {
            const marker = new BMap.Marker(point);
            marker.setIcon(icon);
            marker.setTitle(name || '');
            const labelText = String(day ?? idx + 1);
            const label = new BMap.Label(labelText, { offset: new BMap.Size(-6, -20) });
            label.setStyle({
              backgroundColor: '#0071e3',
              color: '#fff',
              border: '2px solid #fff',
              borderRadius: '999px',
              padding: '0 6px',
              fontWeight: '600',
              boxShadow: '0 8px 16px rgba(0,113,227,0.3)'
            });
            marker.setLabel(label);
            map.addOverlay(marker);
            const info = new BMap.InfoWindow(`<div class="map-tooltip">#${labelText} · ${name || ''}</div>`);
            marker.addEventListener('mouseover', () => map.openInfoWindow(info, point));
            marker.addEventListener('mouseout', () => map.closeInfoWindow());
          });
          if (points.length > 1) {
            const poly = new BMap.Polyline(points.map(p => p.point), { strokeColor: '#0071e3', strokeWeight: 4 });
            map.addOverlay(poly);
            map.setViewport(points.map(p => p.point));
          } else if (points.length === 1) {
            map.centerAndZoom(points[0].point, 13);
          }
        }
        if (!markers.length && !waypoints.length && centerQuery) {
          const geocoder = new BMap.Geocoder();
          geocoder.getPoint(centerQuery, (point: any) => {
            if (point) {
              map.centerAndZoom(point, 12);
            }
          });
        }
      }
    })();
  }, [loaded, markers, centerQuery, waypoints, routeMode]);

  if (error) return <div className="card">{error}</div>;
  return <div className="map" ref={ref} />;
}
