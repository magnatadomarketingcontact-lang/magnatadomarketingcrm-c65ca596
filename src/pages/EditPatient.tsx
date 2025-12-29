import { PatientForm } from '@/components/patients/PatientForm';

export default function EditPatient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar Paciente</h1>
        <p className="text-muted-foreground">Atualize as informações do paciente</p>
      </div>
      <PatientForm />
    </div>
  );
}
