import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Patient, PROCEDURE_LABELS, MEDIA_LABELS, ProcedureType, MediaOrigin } from '@/types/patient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface DashboardChartsProps {
  patients: Patient[];
}

const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];

export function DashboardCharts({ patients }: DashboardChartsProps) {
  const safePatients = patients ?? [];
  const closedPatients = safePatients.filter(p => p?.status === 'fechado');

  const procedureData = useMemo(() => {
    const counts: Record<ProcedureType, { count: number; value: number }> = {
      protese_flexivel: { count: 0, value: 0 },
      protese_total: { count: 0, value: 0 },
      protese_ppr: { count: 0, value: 0 },
      protese_ppr_mista: { count: 0, value: 0 },
    };

    closedPatients.forEach(patient => {
      const procs = patient?.procedures ?? [];
      procs.forEach(proc => {
        if (counts[proc]) {
          counts[proc].count++;
          counts[proc].value += (patient?.closedValue ?? 0) / (procs.length || 1);
        }
      });
    });

    return Object.entries(counts)
      .filter(([_, data]) => data.count > 0)
      .map(([key, data]) => ({
        name: (PROCEDURE_LABELS[key as ProcedureType] ?? key).replace('Prótese ', ''),
        quantidade: data.count,
        valor: Math.round(data.value),
      }));
  }, [closedPatients]);

  const mediaData = useMemo(() => {
    const counts: Record<MediaOrigin, number> = {
      facebook: 0,
      instagram: 0,
      indicacao: 0,
      guia_campanha: 0,
    };

    closedPatients.forEach(patient => {
      const origin = patient?.mediaOrigin;
      if (origin && counts[origin] !== undefined) {
        counts[origin]++;
      }
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([key, count]) => ({
        name: MEDIA_LABELS[key as MediaOrigin] ?? key,
        value: count,
      }));
  }, [closedPatients]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry?.name}: {entry?.name === 'valor' 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry?.value ?? 0)
                : entry?.value ?? 0}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="glass-card animate-fade-in">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Faturamento por Procedimento
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {procedureData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Nenhum fechamento registrado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={procedureData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card animate-fade-in" style={{ animationDelay: '100ms' }}>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Origem das Conversões
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {mediaData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Nenhum fechamento registrado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={mediaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mediaData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
