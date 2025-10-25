"use client";
import { useEffect, useState } from 'react';
import { addExpense, deleteExpense, listExpenses, listTrips } from '@/lib/storage';
import type { Expense, TripPlan } from '@/lib/types';
import { rid } from '@/lib/id';
import VoiceInput from '@/components/VoiceInput';

export default function ExpensesPage() {
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [tripId, setTripId] = useState<string>('');
  const [items, setItems] = useState<Expense[]>([]);
  const [category, setCategory] = useState('餐饮');
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('');

  useEffect(() => { (async () => { const ts = await listTrips(); setTrips(ts); setTripId(ts[0]?.id || ''); })(); }, []);
  useEffect(() => { (async () => setItems(await listExpenses(tripId)))(); }, [tripId]);

  async function add() {
    if (!tripId) return;
    await addExpense({ id: rid('exp'), tripId, createdAt: Date.now(), category, amount: Number(amount), note });
    setAmount(0); setNote('');
    setItems(await listExpenses(tripId));
  }

  async function remove(id: string) {
    await deleteExpense(id);
    setItems(await listExpenses(tripId));
  }

  return (
    <div className="card">
      <h2>旅行费用</h2>
      <div className="row">
        <div className="col">
          <label>行程</label>
          <select value={tripId} onChange={e=>setTripId(e.target.value)}>
            {trips.map(t => <option key={t.id} value={t.id}>{t.input.destination} · {t.input.days}天</option>)}
          </select>
        </div>
        <div className="col">
          <label>类别</label>
          <select value={category} onChange={e=>setCategory(e.target.value)}>
            {['交通','住宿','餐饮','门票','购物','其他'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col">
          <label>金额（元）</label>
          <input type="number" value={amount} onChange={e=>setAmount(parseFloat(e.target.value||'0'))} />
        </div>
      </div>
      <div className="row">
        <div className="col">
          <label>备注</label>
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="可用语音快速输入" />
        </div>
        <div className="col" style={{ alignItems:'flex-end', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <VoiceInput buttonLabel="语音记账" onResult={t=>setNote(t)} />
          <button onClick={add}>添加</button>
        </div>
      </div>
      <div style={{ height:12 }} />
      <div className="list">
        {items.map(i => (
          <div key={i.id} className="list-item">
            <div>
              <div>{i.category} · ¥{i.amount.toFixed(2)}</div>
              {i.note && <div className="muted">{i.note}</div>}
            </div>
            <div className="muted">{new Date(i.createdAt).toLocaleString()}</div>
            <button className="ghost" onClick={()=>remove(i.id)}>删除</button>
          </div>
        ))}
      </div>
    </div>
  );
}

