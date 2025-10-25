"use client";
import { useEffect, useState } from 'react';
import { listTrips, deleteTrip } from '@/lib/storage';
import type { TripPlan } from '@/lib/types';

export default function TripsPage() {
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { setTrips(await listTrips()); setLoading(false); })(); }, []);

  async function remove(id: string) {
    await deleteTrip(id);
    setTrips(await listTrips());
  }

  return (
    <div className="card">
      <h2>我的行程</h2>
      {loading && <p className="muted">加载中…</p>}
      {!loading && trips.length === 0 && <p className="muted">暂无行程，回到首页生成一个吧。</p>}
      <div className="list">
        {trips.map(t => (
          <div key={t.id} className="list-item">
            <div>
              <div>{t.input.destination} · {t.input.days} 天 · {new Date(t.createdAt).toLocaleString()}</div>
              {t.input.preferences?.interests?.length ? <div className="muted">偏好：{t.input.preferences?.interests.join(' / ')}</div> : null}
            </div>
            <div>
              <button className="ghost" onClick={()=>remove(t.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

