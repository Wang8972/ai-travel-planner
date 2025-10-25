import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, days, budgetCNY, people, preferences, startDate, llm } = body || {};

    if (llm?.apiKey && llm?.baseUrl && llm?.model) {
      const sys = '你是专业旅行规划师。基于用户需求生成详细逐日行程，包含交通、住宿、景点与餐饮建议，JSON 输出。';
      const user = `目的地:${destination}; 天数:${days}; 预算:${budgetCNY||''}; 人数:${people||''}; 偏好:${preferences?.interests?.join(' ')}; 起始:${startDate||''}.`;
      const content = await chatCompletion({ config: llm, messages: [ { role:'system', content: sys }, { role:'user', content: user } ] });
      try {
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        const parsed = JSON.parse(content.slice(jsonStart, jsonEnd+1));
        return NextResponse.json(parsed);
      } catch {
        // 非严格 JSON，回退为简单包装
        return NextResponse.json({ raw: content });
      }
    }

    // 无 LLM Key 时返回最小可用 Mock
    const demo = {
      id: 'demo',
      itinerary: Array.from({ length: Math.max(1, Number(days) || 3) }).map((_, i) => ({
        day: i+1,
        title: i===0 ? `${destination} 抵达与市区漫步` : `探索 ${destination} 第 ${i+1} 天`,
        description: '示例行程：上午热门景点，下午美食/购物，晚上休息',
      })),
      hotels: [{ name: `${destination} 市中心家庭友好酒店` }],
      restaurants: [{ name: '人气拉面店' }, { name: '当地甜品店' }],
      transport: ['地铁/步行为主，适当打车'],
      notes: '未配置 LLM Key，当前为示例行程。',
    };
    return NextResponse.json(demo);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}

