import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatients } from '@/contexts/PatientContext';
import { Patient, PatientStatus, MediaOrigin, ProcedureType, STATUS_LABELS, MEDIA_LABELS, PROCEDURE_LABELS } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Trash2, UserPlus } from 'lucide-react';

export function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addPatient, updatePatient, deletePatient, getPatientById } = usePatients();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    contactDate: '',
    appointmentDate: '',
    status: 'agendado' as PatientStatus,
    closedValue: '',
    mediaOrigin: 'instagram' as MediaOrigin,
    procedures: [] as ProcedureType[],
    observations: '',
  });

  useEffect(() => {
    if (id) {
      const patient = getPatientById(id);
      if (patient) {
        setFormData({
          name: patient.name,
          phone: patient.phone,
          contactDate: patient.contactDate,
          appointmentDate: patient.appointmentDate,
          status: patient.status,
          closedValue: patient.closedValue?.toString() || '',
          mediaOrigin: patient.mediaOrigin,
          procedures: patient.procedures,
          observations: patient.observations || '',
        });
      }
    }
  }, [id, getPatientById]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.contactDate || !formData.appointmentDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.procedures.length === 0) {
      toast.error('Selecione pelo menos um procedimento');
      return;
    }

    const patientData = {
      name: formData.name,
      phone: formData.phone,
      contactDate: formData.contactDate,
      appointmentDate: formData.appointmentDate,
      status: formData.status,
      closedValue: formData.status === 'fechado' ? parseFloat(formData.closedValue) || 0 : undefined,
      mediaOrigin: formData.mediaOrigin,
      procedures: formData.procedures,
      observations: formData.observations,
    };

    if (isEditing && id) {
      updatePatient(id, patientData);
      toast.success('Paciente atualizado com sucesso!');
    } else {
      addPatient(patientData);
      toast.success('Paciente cadastrado com sucesso!');
    }

    navigate('/contatos');
  };

  const handleDelete = () => {
    if (id && confirm('Tem certeza que deseja excluir este paciente?')) {
      deletePatient(id);
      toast.success('Paciente excluído com sucesso!');
      navigate('/contatos');
    }
  };

  const toggleProcedure = (procedure: ProcedureType) => {
    setFormData(prev => ({
      ...prev,
      procedures: prev.procedures.includes(procedure)
        ? prev.procedures.filter(p => p !== procedure)
        : [...prev.procedures, procedure],
    }));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="glass-card animate-fade-in">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <UserPlus className="h-5 w-5 text-primary-foreground" />
            </div>
            {isEditing ? 'Editar Paciente' : 'Novo Paciente'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Paciente *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
                className="bg-background"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
                className="bg-background"
              />
            </div>

            {/* Datas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactDate">Data do Contato *</Label>
                <Input
                  id="contactDate"
                  type="date"
                  value={formData.contactDate}
                  onChange={e => setFormData(prev => ({ ...prev, contactDate: e.target.value }))}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentDate">Data do Agendamento *</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={e => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status do Paciente *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: PatientStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor Fechado */}
            {formData.status === 'fechado' && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="closedValue">Valor Fechado (R$) *</Label>
                <Input
                  id="closedValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.closedValue}
                  onChange={e => setFormData(prev => ({ ...prev, closedValue: e.target.value }))}
                  placeholder="0,00"
                  className="bg-background"
                />
              </div>
            )}

            {/* Mídia */}
            <div className="space-y-2">
              <Label>Mídia de Origem *</Label>
              <Select
                value={formData.mediaOrigin}
                onValueChange={(value: MediaOrigin) => setFormData(prev => ({ ...prev, mediaOrigin: value }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione a mídia" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEDIA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Procedimentos */}
            <div className="space-y-3">
              <Label>Tipo de Procedimento *</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(PROCEDURE_LABELS).map(([value, label]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={value}
                      checked={formData.procedures.includes(value as ProcedureType)}
                      onCheckedChange={() => toggleProcedure(value as ProcedureType)}
                    />
                    <Label htmlFor={value} className="font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={e => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Anotações adicionais..."
                rows={3}
                className="bg-background resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 gradient-primary text-primary-foreground hover:opacity-90">
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Atualizar' : 'Salvar'}
              </Button>
              {isEditing && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
