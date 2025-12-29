import { usePatients } from '@/contexts/PatientContext';
import { PatientTable } from '@/components/patients/PatientTable';
import { CheckCircle } from 'lucide-react';

export default function ClosedDeals() {
  const { patients } = usePatients();
  const closedPatients = patients.filter(p => p.status === 'fechado');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fechados</h1>
        <p className="text-muted-foreground">Pacientes que fecharam negócio</p>
      </div>
      <PatientTable
        patients={closedPatients}
        title="Negócios Fechados"
        icon={<CheckCircle className="h-5 w-5 text-primary-foreground" />}
      />
    </div>
  );
}
