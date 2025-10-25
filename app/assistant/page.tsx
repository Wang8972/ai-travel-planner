"use client";
import { useEffect, useState } from 'react';
import { listTrips } from '@/lib/storage';
import type { TripPlan } from '@/lib/types';

export default function AssistantPage() {
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [tripId, setTripId] = useState<string>('');
  const [q, setQ] = useState('');
  const [a, setA] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async () => { const ts = await listTrips(); setTrips(ts); setTripId(ts[0]?.id || ''); })(); }, []);

  async function ask() {
    setLoading(true); setA('');
    try {
      const s = await import('@/lib/storage').then(m=>m.getSettings());
      const llm = await s;
      const res = await fetch('/api/assistant', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tripId, question: q, llm: llm.llmApiKey && llm.llmBaseUrl && llm.llmModel ? { baseUrl: llm.llmBaseUrl, apiKey: llm.llmApiKey, model: llm.llmModel } : undefined }) });
      const text = await res.text();
      if (!res.ok) throw new Error(`助手接口错误: ${res.status} ${text}`);
      let data: any; try { data = JSON.parse(text); } catch { throw new Error(`助手接口返回非 JSON: ${text}`); }
      setA(data.answer || data.raw || '');
    } catch (e: any) {
      setA(e?.message || '调用失败');
    } finally { setLoading(false); }
  }

  return (
    <div className="card">
      <h2>旅行助手</h2>
      <div className="row">
        <div className="col">
          <label>当前行程</label>
          <select value={tripId} onChange={e=>setTripId(e.target.value)}>
            {trips.map(t => <option key={t.id} value={t.id}>{t.input.destination} · {t.input.days}天</option>)}
          </select>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <label>问题</label>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="例如：今天下雨，能推荐室内亲子活动吗？" />
        </div>
        <div className="col" style={{ textAlign:'right' }}>
          <button onClick={ask} disabled={loading}>{loading ? '思考中…' : '询问助手'}</button>
        </div>
      </div>
      <div style={{ height:12 }} />
      <div className="card">
        <div className="muted">回答</div>
        <div>{a || '—'}</div>
      </div>
    </div>
  );
}
