# AI Travel Planner (Web)

简化旅行规划过程，通过 AI 了解用户需求，自动生成详细的旅行路线和建议，并提供实时旅行辅助。

本仓库包含：
- Web 前端（Next.js + TypeScript）
- 语音输入（浏览器 Web Speech API）
- 地图（高德/百度任选，其 API Key 在设置页输入）
- 行程规划与费用预算（可选 LLM，Key 在设置页输入）
- 本地数据存储（IndexedDB）与可选云端同步（Supabase）
- Docker 镜像与 GitHub Actions（可选推送至阿里云镜像仓库）

重要注意：不要将任何 API Key 写入代码或提交到仓库。项目提供“设置”页输入与本地保存 Key，或通过环境变量/仓库密钥配置。

## 快速开始

1. 安装依赖
   - Node.js 18+（建议 20）
   - `npm install`

2. 开发运行
   - `npm run dev`
   - 打开 `http://localhost:3000`

3. 配置 API Keys（运行后在应用内设置页完成）：
   - 地图：高德或百度 Map JS SDK Key
   - LLM：OpenAI 兼容接口 Base URL、Model、API Key（或你选择的其它模型提供商）
   - Supabase：项目 URL 与 Anon Key（用于登录与云同步，可选）

4. 构建与运行（Docker）
   - `npm run build`
   - `docker build -t ai-travel-planner:local .`
   - `docker run -p 3000:3000 ai-travel-planner:local`

## 功能概览

- 智能行程规划：
  - 通过文本或语音输入目的地/天数/预算/偏好等，生成包含交通、住宿、景点、餐厅的行程草案。
  - 后端提供 `/api/plan` 接口，支持使用用户提供的 LLM Key 调用 OpenAI 兼容接口；未配置时返回本地 Mock，便于无 Key 体验。

- 费用预算与管理：
  - 通过 `/api/budget`（LLM 可选）估算预算；
  - 在“费用”页面用语音快速记账，并持久化到本地/云端。

- 用户管理与数据存储：
  - 本地默认使用 IndexedDB 存储行程与消费；
  - 可在设置中启用 Supabase，同步计划、偏好与费用；
  - 注册/登录采用 Supabase Auth（邮箱/密码或第三方，视你配置）。

- 地图与导航：
  - 选择高德或百度（设置中填入 Key），地图组件将动态加载对应 SDK；
  - 展示行程地点、路径草案与基本导航链接。

## 部署与 CI/CD

- Docker：仓库包含多阶段构建镜像，生产运行使用 `node:20-alpine`。
- GitHub Actions：`.github/workflows/docker.yml` 实现镜像构建与（可选）推送至阿里云镜像仓库。
  - 配置以下仓库密钥后自动推送：
    - `ALIYUN_REGISTRY`（例：`registry.cn-hangzhou.aliyuncs.com`）
    - `ALIYUN_NAMESPACE`（你的命名空间）
    - `ALIYUN_USERNAME` / `ALIYUN_PASSWORD`
    - `IMAGE_NAME`（例：`ai-travel-planner`）

## 安全与合规

- 切勿在代码中硬编码任何密钥。
- 本应用将密钥保存在浏览器 `localStorage`（仅本机）；
  - 如果你不希望密钥进入服务端日志，请保持“仅前端直连”模式（适用于地图/部分 API）；
  - LLM 代理 API 仅在你主动提供 Key 时调用，默认返回本地 Mock。

## PDF 提交

- `submission.pdf` 文件包含 GitHub 仓库地址与本 README 摘要（当前仓库地址提交后可自行更新该 PDF）。

## 开发脚本

- `npm run dev` 开发模式
- `npm run build` 生产构建
- `npm run start` 生产启动
- `npm run lint` 代码检查

## 目录结构（节选）

```
app/                 # Next.js App Router 入口
  api/               # 服务器端 API（LLM 代理等）
  (features)/        # 功能性页面/段
components/          # 通用组件（语音、地图等）
lib/                 # 工具与存储封装（IndexedDB/Supabase）
public/              # 静态资源
```

更多细节见应用内“设置”与源码注释。
