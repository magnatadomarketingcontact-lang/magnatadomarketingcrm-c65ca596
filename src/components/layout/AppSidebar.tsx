import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Calendar,
  XCircle,
  CheckCircle,
  Users,
  FileSpreadsheet,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logoMagnata from '@/assets/logo-magnata.jpeg';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pacientes/novo', icon: UserPlus, label: 'Novo Paciente' },
  { to: '/agendamentos', icon: Calendar, label: 'Agendamentos' },
  { to: '/fechados', icon: CheckCircle, label: 'Fechados' },
  { to: '/sem-interesse', icon: XCircle, label: 'Sem Interesse' },
  { to: '/contatos', icon: Users, label: 'Todos os Contatos' },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <img 
                src={logoMagnata} 
                alt="Magnata Logo" 
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">MAGNATA</h1>
                <p className="text-xs text-sidebar-foreground/60">DO CRM</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <IconComponent className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Export Button */}
          <div className="border-t border-sidebar-border p-4">
            <NavLink
              to="/exportar"
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-lg bg-sidebar-accent px-4 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/80"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background px-4 py-3 lg:hidden">
      <button 
        onClick={onMenuClick}
        className="p-2 rounded-lg text-foreground hover:bg-muted"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex items-center gap-2">
        <img 
          src={logoMagnata} 
          alt="Magnata Logo" 
          className="h-8 w-8 rounded-lg object-cover"
        />
        <span className="font-bold text-foreground">MAGNATA DO CRM</span>
      </div>
    </header>
  );
}
