import { PatientForm } from '@/components/patients/PatientForm';

export default function NewPatient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novo Paciente</h1>
        <p className="text-muted-foreground">Cadastre um novo paciente no sistema</p>
      </div>
      <PatientForm />
    </div>
  );
}
