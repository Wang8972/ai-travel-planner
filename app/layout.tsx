import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'AI Travel Planner',
  description: 'AI 辅助 · 语音输入 · 沉浸式旅行规划体验',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="app-header">
          <nav className="nav">
            <Link href="/" aria-label="AI Travel Planner 主页">
              <strong>Æther Trips</strong>
            </Link>
            <div className="spacer" />
            <Link href="/trips">我的行程</Link>
            <Link href="/expenses">费用</Link>
            <Link href="/assistant">旅行助手</Link>
            <Link href="/settings">设置</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">© {new Date().getFullYear()} Æther Trips</footer>
      </body>
    </html>
  );
}
