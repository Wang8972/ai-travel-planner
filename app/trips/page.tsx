"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listTrips, deleteTrip } from '@/lib/storage';
import type { TripPlan } from '@/lib/types';

export default function TripsPage() {
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setTrips(await listTrips());
      setLoading(false);
    })();
  }, []);

  async function remove(id: string) {
    await deleteTrip(id);
    setTrips(await listTrips());
  }

  return (
    <section className="card">
      <h2>我的行程档案</h2>
      {loading && <p className="muted">加载中…</p>}
      {!loading && trips.length === 0 && <p className="muted">暂无记录，回到首页生成第一份 AI 行程吧。</p>}
      <div className="record-list">
        {trips.map(trip => (
          <div key={trip.id} className="record-item">
            <div>
              <strong>{trip.input.destination}</strong>
              <div className="muted">{trip.input.days} 天 · {trip.input.people ?? 2} 人 · {new Date(trip.createdAt).toLocaleDateString()}</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link className="primary" style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center' }} href={`/trips/${trip.id}`}>
                查看详情
              </Link>
              <button className="ghost" onClick={() => remove(trip.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

