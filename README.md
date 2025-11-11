# AI Travel Planner (Web)

Æther Trips 是一款语音驱动的 Web 端 AI 旅行规划师：输入（或说出）目的地、天数、预算与偏好后，系统会生成逐日行程、公共交通方案、地图动线以及依据高德推荐榜单的酒店建议。

## 亮点功能

- **智能行程规划**
  - `/api/plan` 使用用户提供的 OpenAI 兼容 LLM（未配置时回退到本地 Mock）。
  - Prompt 强制输出结构化 JSON：每日行程带 `location.lat/lng`（仅用于地图绘制）、`transit.segments`（地铁/公交/火车的耗时与费用）以及 `hotels`（含“高德推荐榜单”标签、评分、价格）。
  - 前端按时间线展示亮点标签与交通方案，同时引用 # 编号定位对应地点。

- **地图与图钉**
  - 设置页可切换高德/百度地图，并输入各自 JS SDK Key。
  - 地图以编号图钉呈现每日行程，鼠标悬停会显示“#N · 地名”，折线自动连结全程路线。
  - 面板同步列出“#N ↔ 地名”的对应关系，满足“在地图上显示每天要去的地方”的需求而无需暴露经纬度。

- **酒店推荐**
  - 首页展示 1–2 家“高德推荐榜单”酒店卡片，包含评分、价格、地址与标签。
  - Prompt 规范 `rankLabel` 的格式（如“高德推荐榜 TOP 1”），保证文案稳定。

- **公共交通方案**
  - 每条行程都内嵌公共交通摘要与逐段方案，覆盖地铁/公交/火车/步行等组合。
  - UI 将耗时、费用、站点整合在同一张卡片，为“综合各类公共交通方式的通勤方案”提供结构化数据。

- **语音输入 + 费用管理**
  - 浏览器 Web Speech API 提供语音输入，无需额外 Key。
  - 费用页支持语音记账，本地 IndexedDB 持久化，可选接入 Supabase 云端同步。

- **记录可查**
  - “我的行程”支持查看详情，详情页包含地图、逐日行程与通勤方案。
  - 数据默认储存在 IndexedDB，可在设置页打开 Supabase 同步。

## 快速开始

```bash
npm install
npm run dev   # http://localhost:3000
```

运行后进入“设置”页粘贴：

- 地图：高德或百度 JS SDK Key；
- LLM：OpenAI 兼容 Base URL / Model / API Key（也可使用阿里云百炼兼容接口）；
- Supabase（可选）：项目 URL 与 Anon Key。

Docker 方式：

```bash
npm run build
docker build -t ai-travel-planner:local .
docker run -p 3000:3000 ai-travel-planner:local
```

## 设计与交互

- 半透明玻璃拟态 + 大圆角的视觉风格，搭配 SF Pro 字体与浅色渐变背景。
- 首页整合表单、地图、每日行程、公共交通与酒店卡片，信息层级清晰。
- MapView 使用编号图钉 + 悬停提示，并自动绘制路线折线。

## 数据与安全

- 所有 Key 均保存在浏览器 IndexedDB，不会进入仓库。
- `/api/plan`、`/api/budget` 只有在提供 LLM Key 时才会访问远程模型；否则返回本地 Mock。
- README、submission.pdf 均提醒不要在代码层面硬编码密钥。

## 部署 / CI

- `Dockerfile` 采用多阶段构建，最终基于 `node:20-alpine` 运行 Next.js standalone 产物。
- `.github/workflows/docker.yml` 可在 push 时构建镜像；若配置了 `ALIYUN_*` 与 `IMAGE_NAME` 仓库密钥，会自动推送到阿里云镜像仓库。
- `submission.pdf` 提供仓库链接与 README 摘要，方便交付材料。

## 常用脚本

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## 可能的后续演进

1. 调用真实的高德酒店/POI API，替换目前由 LLM 生成的榜单数据。
2. 在 `/trips/[id]` 详情页支持导出 PDF 或分享链接。
3. 将公共交通方案与地图进一步联动，例如根据交通方式渲染不同颜色的路线。
