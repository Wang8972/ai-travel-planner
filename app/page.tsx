"use client";
import { useMemo, useState } from 'react';
import VoiceInput from '@/components/VoiceInput';
import MapView from '@/components/MapView';
import { rid } from '@/lib/id';
import type { TripInput, TripPlan, ItineraryItem, LocationPoint } from '@/lib/types';
import { saveTrip } from '@/lib/storage';
import { guessCoords } from '@/lib/geo';
import { modeColor } from '@/lib/amap';

type SanitizedItinerary = ItineraryItem & { location: LocationPoint };

export default function HomePage() {
  const [destination, setDestination] = useState('中国 上海');
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState(15000);
  const [people, setPeople] = useState(3);
  const [prefs, setPrefs] = useState('亲子 美食 动漫');
  const [startDate, setStartDate] = useState('');
  const [result, setResult] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input: TripInput = useMemo(() => ({
    destination,
    days: Number(days),
    budgetCNY: Number(budget) || undefined,
    people: Number(people) || undefined,
    preferences: { interests: prefs.split(/\s+/).filter(Boolean) },
    startDate: startDate || undefined,
  }), [destination, days, budget, people, prefs, startDate]);

  const sanitizedItinerary: SanitizedItinerary[] = useMemo(() => {
    const fallback = guessCoords(destination);
    return (result?.itinerary ?? []).map((item, idx) => {
      const loc = item?.location;
      if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
        return item as SanitizedItinerary;
      }
      return {
        ...item,
        location: {
          name: loc?.name || `${destination} 打卡点 ${idx + 1}`,
          lat: fallback.lat,
          lng: fallback.lng,
          address: loc?.address || fallback.address,
        },
      } as SanitizedItinerary;
    });
  }, [result, destination]);

  const transitConnections = useMemo(() => {
    const items = sanitizedItinerary;
    const connections = [] as { from: { lat: number; lng: number }; to: { lat: number; lng: number }; color: string }[];
    for (let i = 1; i < items.length; i += 1) {
      const prev = items[i - 1];
      const current = items[i];
      if (!prev || !current) continue;
      const dominantMode = current.transit?.segments?.[0]?.mode;
      connections.push({
        from: prev.location,
        to: current.location,
        color: modeColor(dominantMode),
      });
    }
    return connections;
  }, [sanitizedItinerary]);

  async function plan() {
    setLoading(true);
    setError(null);
    try {
      const settings = await import('@/lib/storage').then(m => m.getSettings());
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          llm: settings.llmApiKey && settings.llmBaseUrl && settings.llmModel
            ? { baseUrl: settings.llmBaseUrl, apiKey: settings.llmApiKey, model: settings.llmModel }
            : undefined,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`计划接口错误: ${res.status} ${text}`);
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`计划接口返回非 JSON: ${text}`);
      }
      const plan: TripPlan = {
        id: data.id || rid('trip'),
        createdAt: Date.now(),
        input,
        itinerary: data.itinerary || [],
        hotels: data.hotels || [],
        restaurants: data.restaurants || [],
        transport: data.transport || [],
        notes: data.notes || data.raw,
        budgetEstimate: data.budgetEstimate,
      };
      if (settings.amapRestKey) {
        try {
          const hotelsRes = await fetch('/api/hotels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination: input.destination, amapKey: settings.amapRestKey }),
          });
          if (hotelsRes.ok) {
            const hotelData = await hotelsRes.json();
            if (hotelData.hotels?.length) {
              plan.hotels = hotelData.hotels;
            }
          }
        } catch (err) {
          console.warn('高德酒店 API 调用失败', err);
        }
      }
      setResult(plan);
      await saveTrip(plan);
    } catch (e: any) {
      setError(e?.message || '规划失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <section className="hero">
        <p className="chip">Æther Trips</p>
        <h1>AI 旅行助手</h1>
        <p>
          输入或说出你的目的地、预算与灵感偏好，系统将调度高德地图、公共交通知识与大语言模型，生成每日动线、通勤方案与酒店推荐。
        </p>
      </section>

      <section className="planner-grid">
        <div className="card">
          <h2>行程参数</h2>
          <div className="form-grid">
            <div>
              <label>目的地</label>
              <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="如：日本 东京" />
            </div>
            <div>
              <label>出行天数</label>
              <input type="number" value={days} onChange={e => setDays(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label>预算（人民币）</label>
              <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label>同行人数</label>
              <input type="number" value={people} onChange={e => setPeople(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label>偏好（空格分隔）</label>
              <input value={prefs} onChange={e => setPrefs(e.target.value)} placeholder="亲子 美食 自然" />
            </div>
            <div>
              <label>出发日期</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
            <VoiceInput
              className="ghost"
              onResult={text => setDestination(text)}
              buttonLabel="语音输入目的地"
            />
            <button className="primary" onClick={plan} disabled={loading}>
              {loading ? '规划中…' : '生成行程'}
            </button>
            <span className="keyboard-hint">提示：设置页可绑定高德 & LLM Key</span>
          </div>
          {error && <p className="muted" style={{ marginTop: 12 }}>{error}</p>}
        </div>

        <div className="card">
          <h2>地图</h2>
          <MapView
            centerQuery={destination}
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
            {sanitizedItinerary.map((it, idx) => {
              const pinLabel = it.day ?? idx + 1;
              return (
                <div key={`${pinLabel}-${it.location.name}`} className="badge">
                  #{pinLabel} · {it.location.name}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {result ? (
        <section className="card">
          <h2>行程洞察</h2>
          <div className="plan-meta">
            <div className="meta-card"><strong>{result.input.days} 天</strong><span>旅程长度</span></div>
            <div className="meta-card"><strong>{result.input.people ?? 2} 人</strong><span>同行人数</span></div>
            <div className="meta-card"><strong>¥{result.input.budgetCNY ?? budget}</strong><span>预算</span></div>
            {result.budgetEstimate && (
              <div className="meta-card"><strong>¥{result.budgetEstimate.total}</strong><span>AI 预算估算</span></div>
            )}
          </div>

          <div className="timeline">
            {sanitizedItinerary.map((it, idx) => {
              const pinLabel = it.day ?? idx + 1;
              return (
                <article key={`${pinLabel}-${it.title}`} className="timeline-item">
                  <div className="chip">Day {it.day}</div>
                  <h4>{it.title}</h4>
                  {it.time && <div className="muted">{it.time}</div>}
                  <p>{it.description}</p>
                  <div className="badge-list">
                    <span className="badge">#{pinLabel}</span>
                    <span className="badge">地点：{it.location.name}</span>
                  </div>
                  {it.highlights && it.highlights.length > 0 && (
                    <div className="badge-list" style={{ marginTop: 8 }}>
                      {it.highlights.map(h => <span className="badge" key={h}>{h}</span>)}
                    </div>
                  )}
                  {it.transit && (
                    <div className="transit">
                      <strong>公共交通方案</strong>
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
              );
            })}
          </div>

          {result.hotels && result.hotels.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div className="hotels-header">
                <h3>高德榜单酒店</h3>
                <span className="muted">精选 1-2 家，含评分与单晚预算</span>
              </div>
              <div className="hotel-grid">
                {result.hotels.map(hotel => (
                  <div key={hotel.name} className="hotel-card">
                    <div className="chip" style={{ background: 'rgba(0,113,227,0.08)' }}>{hotel.rankLabel}</div>
                    <h4>{hotel.name}</h4>
                    <p className="muted">{hotel.address}</p>
                    <div className="plan-meta" style={{ margin: '12px 0' }}>
                      <div className="meta-card"><strong>{hotel.rating.toFixed(1)}</strong><span>评分</span></div>
                      <div className="meta-card"><strong>¥{hotel.pricePerNight}</strong><span>每晚</span></div>
                    </div>
                    {hotel.tags?.length ? (
                      <div className="badge-list">
                        {hotel.tags.map(tag => <span key={tag} className="badge">{tag}</span>)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="card">
          <h2>尚未生成行程</h2>
          <p className="muted">设置参数后点击“生成行程”，AI 将输出每日动线、公共交通方案与高德榜单酒店。</p>
        </section>
      )}
    </div>
  );
}
