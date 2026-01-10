import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, PatientStatus, MediaOrigin, ProcedureType } from '@/types/patient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface PatientContextType {
  patients: Patient[];
  isLoading: boolean;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getPatientById: (id: string) => Patient | undefined;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

// Map database row to Patient type
const mapDbToPatient = (row: any): Patient => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  contactDate: row.contact_date,
  appointmentDate: row.appointment_date,
  status: row.status as PatientStatus,
  closedValue: row.closed_value ? Number(row.closed_value) : undefined,
  mediaOrigin: row.media_origin as MediaOrigin,
  procedures: (row.procedures || []) as ProcedureType[],
  observations: row.observations || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch patients when user changes
  useEffect(() => {
    if (user) {
      fetchPatients();
    } else {
      setPatients([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchPatients = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPatients((data || []).map(mapDbToPatient));
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast.error('Erro ao carregar pacientes');
    } finally {
      setIsLoading(false);
    }
  };

  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          name: patientData.name,
          phone: patientData.phone,
          contact_date: patientData.contactDate,
          appointment_date: patientData.appointmentDate,
          status: patientData.status,
          closed_value: patientData.closedValue || null,
          media_origin: patientData.mediaOrigin,
          procedures: patientData.procedures,
          observations: patientData.observations || null,
        })
        .select()
        .single();

      if (error) throw error;

      setPatients(prev => [mapDbToPatient(data), ...prev]);
      toast.success('Paciente adicionado com sucesso!');
    } catch (error: any) {
      console.error('Error adding patient:', error);
      toast.error('Erro ao adicionar paciente');
      throw error;
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.contactDate !== undefined) updateData.contact_date = updates.contactDate;
      if (updates.appointmentDate !== undefined) updateData.appointment_date = updates.appointmentDate;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.closedValue !== undefined) updateData.closed_value = updates.closedValue;
      if (updates.mediaOrigin !== undefined) updateData.media_origin = updates.mediaOrigin;
      if (updates.procedures !== undefined) updateData.procedures = updates.procedures;
      if (updates.observations !== undefined) updateData.observations = updates.observations;

      const { data, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPatients(prev =>
        prev.map(p => (p.id === id ? mapDbToPatient(data) : p))
      );
      toast.success('Paciente atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error('Erro ao atualizar paciente');
      throw error;
    }
  };

  const deletePatient = async (id: string) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPatients(prev => prev.filter(p => p.id !== id));
      toast.success('Paciente removido com sucesso!');
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast.error('Erro ao remover paciente');
      throw error;
    }
  };

  const getPatientById = (id: string) => {
    return patients.find(p => p.id === id);
  };

  return (
    <PatientContext.Provider value={{ patients, isLoading, addPatient, updatePatient, deletePatient, getPatientById }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}
