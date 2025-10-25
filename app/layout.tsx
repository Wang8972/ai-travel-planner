import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'AI Travel Planner',
  description: 'Web AI 旅行规划师',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="app-header">
          <nav className="nav">
            <Link href="/">AI 旅行规划</Link>
            <div className="spacer" />
            <Link href="/trips">我的行程</Link>
            <Link href="/expenses">费用</Link>
            <Link href="/assistant">旅行助手</Link>
            <Link href="/settings">设置</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">© {new Date().getFullYear()} AI Travel Planner</footer>
      </body>
    </html>
  );
}

