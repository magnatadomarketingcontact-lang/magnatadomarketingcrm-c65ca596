import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Calendar,
  XCircle,
  CheckCircle,
  Users,
  FileSpreadsheet,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pacientes/novo', icon: UserPlus, label: 'Novo Paciente' },
  { to: '/agendamentos', icon: Calendar, label: 'Agendamentos' },
  { to: '/fechados', icon: CheckCircle, label: 'Fechados' },
  { to: '/sem-interesse', icon: XCircle, label: 'Sem Interesse' },
  { to: '/contatos', icon: Users, label: 'Todos os Contatos' },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Crown className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">MAGNATA</h1>
            <p className="text-xs text-sidebar-foreground/60">DO CRM</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Export Button */}
        <div className="border-t border-sidebar-border p-4">
          <NavLink
            to="/exportar"
            className="flex items-center justify-center gap-2 rounded-lg bg-sidebar-accent px-4 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/80"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
