import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, days, budgetCNY, people, preferences, startDate, llm } = body || {};

    if (llm?.apiKey && llm?.baseUrl && llm?.model) {
      const sys = `你是高级旅行规划官，必须输出严格 JSON（UTF-8，无多余文本）。示例结构：
{
  "id": "trip_xxx",
  "itinerary": [
    {
      "day": 1,
      "title": "抵达与城市初探",
      "description": "上午…… 下午…… 晚上……",
      "time": "08:00-22:00",
      "highlights": ["teamLab Planets", "筑地场外市场"],
      "location": {"name": "teamLab Planets", "lat": 35.640794, "lng": 139.78484, "address": "东京都江东区"},
      "transit": {
        "summary": "地铁+步行约 45 分钟，¥25",
        "totalDurationMinutes": 45,
        "totalCostCNY": 25,
        "segments": [
          {"mode": "地铁", "lineName": "银座线", "from": "上野", "to": "新桥", "durationMinutes": 18, "costCNY": 12},
          {"mode": "地铁", "lineName": "百合海鸥线", "from": "新桥", "to": "台场", "durationMinutes": 15, "costCNY": 10},
          {"mode": "步行", "durationMinutes": 12, "distanceKm": 0.9}
        ]
      }
    }
  ],
  "hotels": [
    {"name": "东京柏悦酒店", "rankLabel": "高德推荐榜 TOP 1", "rating": 4.8, "pricePerNight": 2200, "address": "新宿区西新宿3-7-1", "lat": 35.6883, "lng": 139.7006},
    {"name": "东京王子公园塔酒店", "rankLabel": "高德亲子榜 TOP 3", "rating": 4.7, "pricePerNight": 1580, "address": "港区芝公园4-8-1", "lat": 35.6563, "lng": 139.7495}
  ],
  "restaurants": [{"name": "一兰拉面", "address": "新宿区歌舞伎町", "cuisine": "拉面", "lat": 35.6938, "lng": 139.7034, "pricePerPerson": 80}],
  "transport": ["购买 Suica/ICOCA 交通卡", "长途使用新干线 e-ticket"],
  "notes": "预留 30 分钟机动时间",
  "budgetEstimate": {"total": 12000, "breakdown": [{"category": "住宿", "amount": 4200}], "tips": ["避开黄金周", "提前预约餐厅"]}
}
硬性要求：
1. itinerary 必须与用户天数一致，day 连续从 1 开始。
2. 每日 transit.summary 必须提供公共交通组合方案，并标注耗时与人民币费用。
3. 所有 location 与酒店都要包含 name、lat、lng，缺数据时使用常见景点/酒店的公开坐标。
4. hotels 列表需引用“高德推荐榜单”字样（如 推荐榜 TOP1 / 亲子榜 TOP3），并写出 rating、pricePerNight、地址与坐标。
5. 严禁输出注释、Markdown 或额外说明文字。`;
      const user = `目的地:${destination}; 天数:${days}; 预算:${budgetCNY || ''}; 人数:${people || ''}; 偏好:${preferences?.interests?.join(' ') || ''}; 起始日期:${startDate || '未指定'}.`;
      const content = await chatCompletion({ config: llm, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] });
      try {
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
        return NextResponse.json(parsed);
      } catch (err) {
        return NextResponse.json({ raw: content }, { status: 200 });
      }
    }

    const demo = {
      id: 'demo',
      itinerary: Array.from({ length: Math.max(1, Number(days) || 3) }).map((_, idx) => ({
        day: idx + 1,
        title: idx === 0 ? `${destination} 抵达` : `${destination} 城市探索 Day ${idx + 1}`,
        description: '示例行程：上午地标，下午亲子/兴趣打卡，晚上欣赏城市夜景。',
        time: '08:00-21:30',
        location: {
          name: `${destination} 热门地标`,
          lat: 39.9042,
          lng: 116.4074,
          address: `${destination} 市中心`,
        },
        transit: {
          summary: '地铁+公交约 50 分钟，¥18',
          totalDurationMinutes: 50,
          totalCostCNY: 18,
          segments: [
            { mode: '地铁', lineName: '2号线', from: '市区', to: '景点口', durationMinutes: 30, costCNY: 8 },
            { mode: '公交', lineName: '101路', from: '地铁站', to: '景区', durationMinutes: 15, costCNY: 4 },
            { mode: '步行', durationMinutes: 5 },
          ],
        },
      })),
      hotels: [
        {
          name: `${destination} 云宿酒店`,
          rankLabel: '高德推荐榜 TOP 2',
          rating: 4.8,
          pricePerNight: 1899,
          address: `${destination} CBD`,
          lat: 39.9,
          lng: 116.39,
        },
      ],
      restaurants: [{ name: `${destination} 人气餐厅`, cuisine: '融合菜' }],
      transport: ['建议购买地铁一日票', '城际段优先高铁'],
      notes: '示例行程（未接入 LLM）',
    };
    return NextResponse.json(demo);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}

