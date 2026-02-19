import { useState } from 'react';
import { usePatients } from '@/contexts/PatientContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, Download, Filter, FileText } from 'lucide-react';
import { generatePdfReport } from '@/lib/generatePdfReport';
import { toast } from 'sonner';
import { STATUS_LABELS, MEDIA_LABELS, PROCEDURE_LABELS, PatientStatus, MediaOrigin } from '@/types/patient';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Export() {
  const { patients } = usePatients();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mediaFilter, setMediaFilter] = useState<string>('all');
  const [includeObservations, setIncludeObservations] = useState(true);

  const filteredPatients = patients.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesMedia = mediaFilter === 'all' || p.mediaOrigin === mediaFilter;
    return matchesStatus && matchesMedia;
  });

  const exportToCSV = () => {
    if (filteredPatients.length === 0) {
      toast.error('Nenhum paciente para exportar');
      return;
    }

    const headers = [
      'Nome',
      'Telefone',
      'Data do Contato',
      'Data do Agendamento',
      'Status',
      'Valor Fechado',
      'Mídia de Origem',
      'Procedimentos',
      ...(includeObservations ? ['Observações'] : []),
    ];

    const rows = filteredPatients.map(p => [
      p.name,
      p.phone,
      format(parseISO(p.contactDate), 'dd/MM/yyyy', { locale: ptBR }),
      format(parseISO(p.appointmentDate), 'dd/MM/yyyy', { locale: ptBR }),
      STATUS_LABELS[p.status],
      p.closedValue ? `R$ ${p.closedValue.toFixed(2)}` : '',
      MEDIA_LABELS[p.mediaOrigin],
      p.procedures.map(proc => PROCEDURE_LABELS[proc]).join('; '),
      ...(includeObservations ? [p.observations || ''] : []),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `magnata_crm_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success(`${filteredPatients.length} pacientes exportados com sucesso!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exportar Dados</h1>
        <p className="text-muted-foreground">Exporte os dados dos pacientes para Excel/CSV</p>
      </div>

      <Card className="glass-card animate-fade-in max-w-2xl">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            Configurar Exportação
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Filtros */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mídia de Origem</Label>
                <Select value={mediaFilter} onValueChange={setMediaFilter}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todas as mídias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as mídias</SelectItem>
                    {Object.entries(MEDIA_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Opções */}
          <div className="space-y-3">
            <span className="text-sm font-medium">Opções</span>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="observations"
                checked={includeObservations}
                onCheckedChange={(checked) => setIncludeObservations(checked as boolean)}
              />
              <Label htmlFor="observations" className="font-normal cursor-pointer">
                Incluir observações
              </Label>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{filteredPatients.length}</strong> pacientes serão exportados
            </p>
          </div>

          {/* Botão de Export */}
          <Button
            onClick={exportToCSV}
            className="w-full gradient-primary text-primary-foreground hover:opacity-90"
            disabled={filteredPatients.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar para CSV/Excel
          </Button>

          <Button
            onClick={() => generatePdfReport({
              patients: filteredPatients,
              periodLabel: `${statusFilter === 'all' ? 'Todos os status' : STATUS_LABELS[statusFilter as PatientStatus]} / ${mediaFilter === 'all' ? 'Todas as mídias' : MEDIA_LABELS[mediaFilter as MediaOrigin]}`,
              includePatientList: true,
              includeObservations,
            })}
            variant="outline"
            className="w-full gap-2"
            disabled={filteredPatients.length === 0}
          >
            <FileText className="h-4 w-4" />
            Exportar para PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
