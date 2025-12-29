import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { NotificationBanner } from '../notifications/NotificationBanner';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="pl-64">
        <NotificationBanner />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
