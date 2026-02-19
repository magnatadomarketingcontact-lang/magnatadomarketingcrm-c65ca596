import { useMemo, useState } from 'react';
import { usePatients } from '@/contexts/PatientContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, TrendingUp, CheckCircle, Calendar, Filter, FileText } from 'lucide-react';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfMonth, isAfter, isBefore, parseISO } from 'date-fns';
import { generatePdfReport } from '@/lib/generatePdfReport';

type PeriodFilter = 'all' | 'day' | 'week' | 'month' | 'year_month';

const YEARS = [2026, 2027, 2028, 2029, 2030];
const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export default function Dashboard() {
  const { patients } = usePatients();
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const filteredPatients = useMemo(() => {
    if (period === 'year_month' && selectedYear) {
      const year = parseInt(selectedYear);
      if (selectedMonth && selectedMonth !== 'all_months') {
        const month = parseInt(selectedMonth) - 1;
        const start = new Date(year, month, 1);
        const end = endOfMonth(start);
        return patients.filter(p => {
          const date = parseISO(p.createdAt);
          return isAfter(date, new Date(start.getTime() - 1)) && isBefore(date, new Date(end.getTime() + 1));
        });
      }
      const start = startOfYear(new Date(year, 0, 1));
      const end = new Date(year, 11, 31, 23, 59, 59);
      return patients.filter(p => {
        const date = parseISO(p.createdAt);
        return isAfter(date, new Date(start.getTime() - 1)) && isBefore(date, new Date(end.getTime() + 1));
      });
    }

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
  }, [patients, period, selectedYear, selectedMonth]);

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

  const getPeriodLabel = () => {
    if (period === 'all') return 'Todo período';
    if (period === 'day') return 'Hoje';
    if (period === 'week') return 'Esta semana';
    if (period === 'month') return 'Este mês';
    if (period === 'year_month') {
      const yearLabel = selectedYear || '';
      const monthLabel = selectedMonth && selectedMonth !== 'all_months'
        ? MONTHS.find(m => m.value === selectedMonth)?.label || ''
        : 'Todos os meses';
      return `${monthLabel} / ${yearLabel}`;
    }
    return 'Todo período';
  };

  const handleExportPdf = () => {
    generatePdfReport({
      patients: filteredPatients,
      periodLabel: getPeriodLabel(),
      includePatientList: true,
      includeObservations: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho do seu laboratório</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleExportPdf} variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={period}
            onValueChange={(v: PeriodFilter) => {
              setPeriod(v);
              if (v !== 'year_month') {
                setSelectedYear('');
                setSelectedMonth('');
              }
            }}
          >
            <SelectTrigger className="w-40 bg-card">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="year_month">Ano / Mês</SelectItem>
            </SelectContent>
          </Select>

          {period === 'year_month' && (
            <>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-28 bg-card">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedYear && (
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-36 bg-card">
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_months">Todos os meses</SelectItem>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}
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
