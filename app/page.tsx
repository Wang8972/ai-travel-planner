"use client";
import { useMemo, useState } from 'react';
import VoiceInput from '@/components/VoiceInput';
import MapView from '@/components/MapView';
import { rid } from '@/lib/id';
import type { TripInput, TripPlan } from '@/lib/types';
import { saveTrip } from '@/lib/storage';

export default function HomePage() {
  const [destination, setDestination] = useState('日本 东京');
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState(10000);
  const [people, setPeople] = useState(2);
  const [prefs, setPrefs] = useState('美食 动漫 亲子');
  const [startDate, setStartDate] = useState<string>('');
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

  async function plan() {
    setLoading(true); setError(null);
    try {
      const s = await import('@/lib/storage').then(m=>m.getSettings());
      const llm = await s;
      const res = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, llm: llm.llmApiKey && llm.llmBaseUrl && llm.llmModel ? { baseUrl: llm.llmBaseUrl, apiKey: llm.llmApiKey, model: llm.llmModel } : undefined }) });
      const text = await res.text();
      if (!res.ok) throw new Error(`计划接口错误: ${res.status} ${text}`);
      let data: any; try { data = JSON.parse(text); } catch { throw new Error(`计划接口返回非 JSON: ${text}`); }
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
      setResult(plan);
      await saveTrip(plan);
    } catch (e: any) {
      setError(e?.message || '规划失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h2>智能行程规划</h2>
          <div className="row">
            <div className="col">
              <label>目的地</label>
              <input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="如：日本 东京" />
            </div>
            <div className="col">
              <label>出行天数</label>
              <input type="number" value={days} onChange={e=>setDays(parseInt(e.target.value||'0'))} />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label>预算（元）</label>
              <input type="number" value={budget} onChange={e=>setBudget(parseInt(e.target.value||'0'))} />
            </div>
            <div className="col">
              <label>同行人数</label>
              <input type="number" value={people} onChange={e=>setPeople(parseInt(e.target.value||'0'))} />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label>偏好（空格分隔）</label>
              <input value={prefs} onChange={e=>setPrefs(e.target.value)} placeholder="美食 动漫 亲子" />
            </div>
            <div className="col">
              <label>出发日期（可选）</label>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
            </div>
          </div>
          <div className="row" style={{ alignItems: 'center' }}>
            <div className="col">
              <VoiceInput onResult={(t)=>{ setDestination(t); }} />
            </div>
            <div className="col" style={{ textAlign:'right' }}>
              <button onClick={plan} disabled={loading}>{loading ? '规划中…' : '生成行程'}</button>
            </div>
          </div>
          {error && <p className="muted">{error}</p>}
        </div>
        <div style={{ height: 12 }} />
        <div className="card">
          <h3>地图</h3>
          <MapView markers={[]} centerQuery={destination} />
          <p className="muted">在设置页配置地图 API Key 后显示。</p>
        </div>
      </div>
      <div className="col">
        <div className="card">
          <h3>行程结果</h3>
          {!result && <p className="muted">暂无结果。点击“生成行程”或在设置页配置 LLM 以获得更优规划。</p>}
          {result && result.itinerary && result.itinerary.length > 0 && (
            <div className="list">
              {result.itinerary.map((it, idx) => (
                <div className="list-item" key={idx}>
                  <div>
                    <div>第{it.day}天 · {it.title}</div>
                    {it.description && <div className="muted">{it.description}</div>}
                  </div>
                  {it.time && <div className="muted">{it.time}</div>}
                </div>
              ))}
            </div>
          )}
          {result && (!result.itinerary || result.itinerary.length === 0) && (
            <div className="card">
              <div className="muted">原始结果</div>
              <pre style={{ whiteSpace:'pre-wrap' }}>{result.notes || 'LLM 未返回结构化行程，请调整提示词或更换模型。'}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

