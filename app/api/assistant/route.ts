import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tripId, question, llm } = body || {};
    if (llm?.apiKey && llm?.baseUrl && llm?.model) {
      const sys = '你是旅行现场助手，回答应简洁可执行，中文输出。';
      const content = await chatCompletion({ config: llm, messages: [ { role:'system', content: sys }, { role:'user', content: String(question||'') } ] });
      return NextResponse.json({ answer: content });
    }
    return NextResponse.json({ answer: `（示例回答）关于「${question||''}」：建议查看附近商场或博物馆等室内活动。` });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}
