import { useState, ReactNode } from 'react';
import { AppSidebar, MobileHeader } from './AppSidebar';
import { NotificationBanner } from '../notifications/NotificationBanner';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-64">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <NotificationBanner />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
