import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, llm } = body || {};
    if (llm?.apiKey && llm?.baseUrl && llm?.model) {
      const sys = '你是旅行费用规划专家。根据用户行程输入估算预算，输出 JSON: {total, breakdown:[{category, amount}], tips}，金额单位 CNY。';
      const user = JSON.stringify(input || {});
      const content = await chatCompletion({ config: llm, messages: [ { role:'system', content: sys }, { role:'user', content: user } ] });
      try {
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        const parsed = JSON.parse(content.slice(jsonStart, jsonEnd+1));
        return NextResponse.json(parsed);
      } catch {
        return NextResponse.json({ raw: content });
      }
    }
    const days = Number(body?.input?.days || 3);
    const people = Number(body?.input?.people || 2);
    const hotel = 400 * days;
    const food = 150 * people * days;
    const transport = 200 * people;
    const tickets = 100 * people * days;
    const total = hotel + food + transport + tickets;
    return NextResponse.json({ total, breakdown: [
      { category: '住宿', amount: hotel },
      { category: '餐饮', amount: food },
      { category: '交通', amount: transport },
      { category: '门票', amount: tickets },
    ], tips: ['为亲子行程预留机动预算', '避开高峰时段以节省交通成本'] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}

