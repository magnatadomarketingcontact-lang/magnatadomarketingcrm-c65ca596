import { usePatients } from '@/contexts/PatientContext';
import { PatientTable } from '@/components/patients/PatientTable';
import { Calendar } from 'lucide-react';

export default function Appointments() {
  const { patients } = usePatients();
  const scheduledPatients = patients.filter(p => p.status === 'agendado');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agendamentos</h1>
        <p className="text-muted-foreground">Pacientes com consulta agendada</p>
      </div>
      <PatientTable
        patients={scheduledPatients}
        title="Pacientes Agendados"
        icon={<Calendar className="h-5 w-5 text-primary-foreground" />}
      />
    </div>
  );
}
