"use client";
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MapView from '@/components/MapView';
import { getTrip } from '@/lib/storage';
import type { TripPlan, LocationPoint, ItineraryItem } from '@/lib/types';
import { guessCoords } from '@/lib/geo';
import { modeColor } from '@/lib/amap';
type Sanitized = ItineraryItem & { location: LocationPoint };
export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      const data = await getTrip(params.id);
      setTrip(data ?? null);
      setLoading(false);
    })();
  }, [params?.id]);
  const sanitizedItinerary: Sanitized[] = useMemo(() => {
    if (!trip) return [];
    const fallback = guessCoords(trip.input.destination);
    return (trip.itinerary ?? []).map((item, idx) => {
      const loc = item.location;
      if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
        return item as Sanitized;
      }
      return {
        ...item,
        location: {
          name: loc?.name || `${trip.input.destination} 打卡 ${idx + 1}`,
          lat: fallback.lat,
          lng: fallback.lng,
          address: loc?.address || fallback.address,
        },
      } as Sanitized;
    });
  }, [trip]);
  const transitConnections = useMemo(() => {
    const connections: { from: { lat: number; lng: number }; to: { lat: number; lng: number }; color: string }[] = [];
    for (let i = 1; i < sanitizedItinerary.length; i += 1) {
      const prev = sanitizedItinerary[i - 1];
      const current = sanitizedItinerary[i];
      if (!prev || !current) continue;
      const mode = current.transit?.segments?.[0]?.mode;
      connections.push({ from: prev.location, to: current.location, color: modeColor(mode) });
    }
    return connections;
  }, [sanitizedItinerary]);
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${trip?.input.destination} 行程`, url });
      } catch (err) {
        console.warn('分享失败', err);
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert('链接已复制，可手动分享。');
    }
  };
  const handleExport = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };
  if (loading) {
    return (
      <section className="card">
        <p className="muted">加载行程中…</p>
      </section>
    );
  }
  if (!trip) {
    return (
      <section className="card">
        <p>未找到对应行程。</p>
        <button className="ghost" onClick={() => router.push('/trips')}>返回列表</button>
      </section>
    );
  }
  return (
    <div className="page">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <button className="ghost" onClick={() => router.back()}>返回</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ghost" onClick={handleShare}>分享链接</button>
            <button className="ghost" onClick={handleExport}>导出 PDF</button>
          </div>
        </div>
        <h2>{trip.input.destination} · {trip.input.days} 天旅程</h2>
        <p className="muted">创建于 {new Date(trip.createdAt).toLocaleString()}</p>
        <div className="plan-meta">
          <div className="meta-card"><strong>{trip.input.days}</strong><span>天数</span></div>
          <div className="meta-card"><strong>{trip.input.people ?? 2}</strong><span>人数</span></div>
          {trip.input.budgetCNY && <div className="meta-card"><strong>¥{trip.input.budgetCNY}</strong><span>预算</span></div>}
        </div>
        <MapView
          centerQuery={trip.input.destination}
          waypoints={sanitizedItinerary.map(it => ({
            name: it.location.name,
            lat: it.location.lat,
            lng: it.location.lng,
            title: `Day ${it.day}`,
            day: it.day,
          }))}
          connections={transitConnections}
        />
        <div className="day-coords">
          {sanitizedItinerary.map((it, idx) => (
            <div key={`${it.day}-${it.location.name}`} className="badge">
              #{it.day ?? idx + 1} · {it.location.name}
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <h3>每日行程</h3>
        <div className="timeline">
          {sanitizedItinerary.map((it, idx) => (
            <article key={`${it.day}-${it.title}`} className="timeline-item">
              <div className="chip">Day {it.day}</div>
              <h4>{it.title}</h4>
              {it.time && <div className="muted">{it.time}</div>}
              <p>{it.description}</p>
              <div className="badge-list">
                <span className="badge">#{it.day ?? idx + 1}</span>
                <span className="badge">地点 {it.location.name}</span>
              </div>
              {it.transit && (
                <div className="transit">
                  <strong>公共交通</strong>
                  <div className="muted">{it.transit.summary}</div>
                  <ul>
                    {it.transit.segments?.map((seg, segmentIdx) => (
                      <li key={segmentIdx}>
                        {seg.mode}
                        {seg.lineName ? ` · ${seg.lineName}` : ''}
                        {seg.from && seg.to ? ` (${seg.from} → ${seg.to})` : ''}
                        {seg.durationMinutes ? ` · ${seg.durationMinutes} 分钟` : ''}
                        {seg.costCNY ? ` · ¥${seg.costCNY}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}