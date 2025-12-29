import { usePatients } from '@/contexts/PatientContext';
import { PatientTable } from '@/components/patients/PatientTable';
import { Users } from 'lucide-react';

export default function AllContacts() {
  const { patients } = usePatients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Todos os Contatos</h1>
        <p className="text-muted-foreground">Lista completa de pacientes cadastrados</p>
      </div>
      <PatientTable
        patients={patients}
        title="Todos os Pacientes"
        icon={<Users className="h-5 w-5 text-primary-foreground" />}
      />
    </div>
  );
}
