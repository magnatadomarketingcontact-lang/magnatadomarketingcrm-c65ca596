import { usePatients } from '@/contexts/PatientContext';
import { PatientTable } from '@/components/patients/PatientTable';
import { XCircle } from 'lucide-react';

export default function NoInterest() {
  const { patients } = usePatients();
  const noInterestPatients = patients.filter(p => p.status === 'sem_interesse');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sem Interesse</h1>
        <p className="text-muted-foreground">Pacientes que não demonstraram interesse</p>
      </div>
      <PatientTable
        patients={noInterestPatients}
        title="Sem Interesse"
        icon={<XCircle className="h-5 w-5 text-primary-foreground" />}
      />
    </div>
  );
}
