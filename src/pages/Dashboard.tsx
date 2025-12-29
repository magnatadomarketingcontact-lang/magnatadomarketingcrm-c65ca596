import { useMemo, useState } from 'react';
import { usePatients } from '@/contexts/PatientContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Users, TrendingUp, CheckCircle, Calendar, Filter } from 'lucide-react';
import { startOfDay, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns';

type PeriodFilter = 'all' | 'day' | 'week' | 'month';

export default function Dashboard() {
  const { patients } = usePatients();
  const [period, setPeriod] = useState<PeriodFilter>('all');

  const filteredPatients = useMemo(() => {
    if (period === 'all') return patients;

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 0 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      default:
        return patients;
    }

    return patients.filter(p => isAfter(parseISO(p.createdAt), startDate));
  }, [patients, period]);

  const stats = useMemo(() => {
    const closedPatients = filteredPatients.filter(p => p.status === 'fechado');
    const totalRevenue = closedPatients.reduce((sum, p) => sum + (p.closedValue || 0), 0);
    const closedCount = closedPatients.length;
    const averageTicket = closedCount > 0 ? totalRevenue / closedCount : 0;
    const scheduledCount = filteredPatients.filter(p => p.status === 'agendado').length;

    return {
      totalRevenue,
      closedCount,
      averageTicket,
      scheduledCount,
      totalPatients: filteredPatients.length,
    };
  }, [filteredPatients]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho do seu laboratório</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={(v: PeriodFilter) => setPeriod(v)}>
            <SelectTrigger className="w-40 bg-card">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Faturado"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          variant="primary"
        />
        <StatsCard
          title="Fechamentos"
          value={stats.closedCount}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Ticket Médio"
          value={formatCurrency(stats.averageTicket)}
          icon={TrendingUp}
        />
        <StatsCard
          title="Agendamentos"
          value={stats.scheduledCount}
          icon={Calendar}
        />
      </div>

      {/* Charts */}
      <DashboardCharts patients={filteredPatients} />

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Total de Pacientes"
          value={stats.totalPatients}
          icon={Users}
        />
        <StatsCard
          title="Taxa de Conversão"
          value={stats.totalPatients > 0 
            ? `${((stats.closedCount / stats.totalPatients) * 100).toFixed(1)}%` 
            : '0%'}
          icon={TrendingUp}
        />
        <StatsCard
          title="Aguardando Atendimento"
          value={filteredPatients.filter(p => p.status === 'agendado').length}
          icon={Calendar}
        />
      </div>
    </div>
  );
}
