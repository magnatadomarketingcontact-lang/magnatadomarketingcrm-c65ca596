import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient, STATUS_LABELS, MEDIA_LABELS, PROCEDURE_LABELS, PatientStatus, MediaOrigin, ProcedureType } from '@/types/patient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Phone, Search, Filter, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PatientTableProps {
  patients: Patient[];
  title: string;
  icon: React.ReactNode;
  showFilters?: boolean;
}

const statusColors: Record<PatientStatus, string> = {
  agendado: 'bg-primary/10 text-primary border-primary/30',
  veio: 'bg-success/10 text-success border-success/30',
  nao_veio: 'bg-destructive/10 text-destructive border-destructive/30',
  sem_interesse: 'bg-muted text-muted-foreground border-muted-foreground/30',
  fechado: 'bg-success/10 text-success border-success/30',
};

export function PatientTable({ patients, title, icon, showFilters = true }: PatientTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mediaFilter, setMediaFilter] = useState<string>('all');
  const [procedureFilter, setProcedureFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(search.toLowerCase()) ||
        patient.phone.includes(search);
      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
      const matchesMedia = mediaFilter === 'all' || patient.mediaOrigin === mediaFilter;
      const matchesProcedure = procedureFilter === 'all' || patient.procedures.includes(procedureFilter as ProcedureType);
      const matchesDate = !dateFilter || patient.appointmentDate === dateFilter;

      return matchesSearch && matchesStatus && matchesMedia && matchesProcedure && matchesDate;
    });
  }, [patients, search, statusFilter, mediaFilter, procedureFilter, dateFilter]);

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            {icon}
          </div>
          <span>{title}</span>
          <Badge variant="secondary" className="ml-auto">
            {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {showFilters && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={mediaFilter} onValueChange={setMediaFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Mídia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as mídias</SelectItem>
                  {Object.entries(MEDIA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={procedureFilter} onValueChange={setProcedureFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Procedimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os procedimentos</SelectItem>
                  {Object.entries(PROCEDURE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
            </div>
          </div>
        )}

        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhum paciente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Paciente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Agendamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Procedimentos</TableHead>
                  <TableHead>Mídia</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient, index) => (
                  <TableRow
                    key={patient.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>
                      <a
                        href={`https://wa.me/55${patient.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </a>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(patient.appointmentDate), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('font-medium', statusColors[patient.status])}>
                        {STATUS_LABELS[patient.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {patient.procedures.map(proc => (
                          <Badge key={proc} variant="secondary" className="text-xs">
                            {PROCEDURE_LABELS[proc].replace('Prótese ', '')}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{MEDIA_LABELS[patient.mediaOrigin]}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-success">
                      {formatCurrency(patient.closedValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/pacientes/${patient.id}`)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
