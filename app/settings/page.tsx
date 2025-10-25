"use client";
import { useEffect, useState } from 'react';
import { getSettings, setSettings, type Settings } from '@/lib/storage';

export default function SettingsPage() {
  const [s, setS] = useState<Settings>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { (async () => setS(await getSettings()))(); }, []);

  const save = async () => { await setSettings(s); setSaved(true); setTimeout(()=>setSaved(false), 1500); };

  return (
    <div className="card">
      <h2>设置</h2>
      <div className="row">
        <div className="col">
          <label>地图提供商</label>
          <select value={s.mapProvider || 'amap'} onChange={e=>setS({ ...s, mapProvider: e.target.value as any })}>
            <option value="amap">高德地图</option>
            <option value="baidu">百度地图</option>
          </select>
        </div>
        <div className="col">
          <label>地图 API Key</label>
          <input value={s.mapApiKey || ''} onChange={e=>setS({ ...s, mapApiKey: e.target.value })} placeholder="在此粘贴 Key（仅保存在本机）" />
        </div>
      </div>
      <div className="row">
        <div className="col">
          <label>LLM Base URL（OpenAI 兼容）</label>
          <input value={s.llmBaseUrl || ''} onChange={e=>setS({ ...s, llmBaseUrl: e.target.value })} placeholder="https://api.openai.com/v1 或其它" />
        </div>
        <div className="col">
          <label>LLM Model</label>
          <input value={s.llmModel || ''} onChange={e=>setS({ ...s, llmModel: e.target.value })} placeholder="如 gpt-4o-mini / qwen-turbo 等" />
        </div>
      </div>
      <div className="row">
        <div className="col">
          <label>LLM API Key</label>
          <input value={s.llmApiKey || ''} onChange={e=>setS({ ...s, llmApiKey: e.target.value })} placeholder="仅保存在本机" />
        </div>
      </div>
      <div className="row">
        <div className="col">
          <label>Supabase URL（可选）</label>
          <input value={s.supabaseUrl || ''} onChange={e=>setS({ ...s, supabaseUrl: e.target.value })} placeholder="https://xxxx.supabase.co" />
        </div>
        <div className="col">
          <label>Supabase Anon Key（可选）</label>
          <input value={s.supabaseAnonKey || ''} onChange={e=>setS({ ...s, supabaseAnonKey: e.target.value })} placeholder="Anon 公钥" />
        </div>
      </div>
      <div className="row">
        <div className="col">
          <label>云同步</label>
          <select value={s.cloudSync ? 'on' : 'off'} onChange={e=>setS({ ...s, cloudSync: e.target.value === 'on' })}>
            <option value="off">关闭（仅本地存储）</option>
            <option value="on">开启（需要配置 Supabase）</option>
          </select>
          <p className="muted">所有 Key 均保存在本机浏览器 IndexedDB，不会提交到服务端。</p>
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <button onClick={save}>{saved ? '已保存' : '保存设置'}</button>
      </div>
    </div>
  );
}

