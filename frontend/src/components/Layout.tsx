/**
 * Основной лейаут: хедер + фиксированный сайдбар + контент
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}
